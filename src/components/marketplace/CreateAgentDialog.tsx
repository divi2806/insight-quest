import { useState } from "react";
import { Loader2, Rocket } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useWeb3 } from "@/contexts/Web3Context";
import { addAgent } from "@/services/agentService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

// Form schema
const formSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }).max(50),
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters" }).max(30),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }).max(300),
  category: z.string().min(1, { message: "Please select a category" }),
  githubUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  price: z.number().min(10, { message: "Minimum price is 10 $TASK" }).max(10000, { message: "Maximum price is 10,000 $TASK" }),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgentCreated: (agent: any) => void;
}

const CATEGORIES = ["Data Analysis", "Code Assistant", "Chatbot", "Image Generation", "Text Processing"];

const CreateAgentDialog: React.FC<CreateAgentDialogProps> = ({
  open,
  onOpenChange,
  onAgentCreated
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useWeb3();

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      displayName: user?.username || "",
      description: "",
      category: "",
      githubUrl: "",
      price: 100,
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!user?.id) {
      toast.error("You need to connect your wallet first");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a new agent with display name
      const newAgent = {
        name: data.name,
        description: data.description,
        category: data.category,
        githubUrl: data.githubUrl,
        price: data.price,
        rating: 0,
        ratingCount: 0,
        creatorId: user.id,
        creatorName: data.displayName || user.username || "Anonymous", // Use display name
        creatorAvatarUrl: user.avatarUrl || "",
        imageUrl: `https://api.dicebear.com/6.x/bottts/svg?seed=${Date.now()}`,
        purchasedBy: [],
      };

      // Add to Firebase
      const createdAgent = await addAgent(newAgent);
      
      toast.success("Agent listed successfully!", {
        description: "Your AI agent is now available on the marketplace.",
      });
      
      onAgentCreated(createdAgent);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Failed to list agent", {
        description: "There was an error while creating your agent. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Rocket className="h-6 w-6 text-brand-purple" />
            List Your AI Agent
          </DialogTitle>
          <DialogDescription>
            Share your custom AI agent with the community and earn $TASK tokens.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agent Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Code Genius" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creator Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your display name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what your AI agent does and why it's useful..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="githubUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com/yourusername/repository" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($TASK tokens)</FormLabel>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{field.value} $TASK</span>
                  </div>
                  <FormControl>
                    <Slider
                      min={10}
                      max={1000}
                      step={10}
                      onValueChange={(value) => field.onChange(value[0])}
                      value={[field.value]}
                      className="py-4"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-brand-purple/30"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="purple-gradient">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                List Agent
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAgentDialog;