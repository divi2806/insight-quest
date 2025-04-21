import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Web3ProviderWrapper } from "@/contexts/Web3Context";
import { TaskProvider } from "@/contexts/TaskContext";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";
import ZappyChat from "./pages/ZappyChat";
import UserProfile from "./pages/UserProfile";
import ContestsPage from "./pages/ContestsPage";
import BusinessPage from "./pages/BusinessPage";
import MarketplacePage from "./pages/MarketplacePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Web3ProviderWrapper>
        <TaskProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contests" element={<ContestsPage />} />
              <Route path="/business" element={<BusinessPage />} />
              <Route path="/chat" element={<ZappyChat />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TaskProvider>
      </Web3ProviderWrapper>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;