import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletProvider, ConnectionProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { toast } from 'sonner';
import { getUserStage, getStageEmoji,getRandomToken,calculateInsightValue } from '../lib/web3Utils';
import { saveUser, getUser, updateUserXP } from '@/services/firebase';
import LevelUpDialog from '@/components/notifications/LevelUpDialog';
import TokenService from '../lib/tokenContract';
import { User } from '@/types';
import { Buffer } from 'buffer';
// Import the styles for the wallet adapter instead of using require
import '@solana/wallet-adapter-react-ui/styles.css';

// Define the Solana devnet cluster
const SOLANA_NETWORK = 'devnet';
const SOLANA_ENDPOINT = clusterApiUrl(SOLANA_NETWORK);

interface Web3ContextType {
  isConnected: boolean;
  connecting: boolean;
  address: string | null;
  user: User | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshUser: () => Promise<void>;
  updateUsername: (username: string) => void;
  addUserXP: (amount: number) => Promise<void>;
  tokenBalance: string;
  fetchTokenBalance: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType>({
  isConnected: false,
  connecting: false,
  address: null,
  user: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  refreshUser: async () => {},
  updateUsername: () => {},
  addUserXP: async () => {},
  tokenBalance: "0",
  fetchTokenBalance: async () => {}
});

export const useWeb3 = () => useContext(Web3Context);

// Web3Provider component that provides the wallet adapter context - renamed for clarity
export const Web3ProviderWrapper = ({ children }: { children: ReactNode }) => {
  // Set up the wallet adapters
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  return (
    <ConnectionProvider endpoint={SOLANA_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Web3ProviderImplementation>
            {children}
          </Web3ProviderImplementation>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Renamed the original Web3Provider to Web3ProviderImplementation for clarity
const Web3ProviderImplementation = ({ children }: { children: ReactNode }) => {
  const { publicKey, connected, connecting, disconnect, connect, wallet } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [dailyLoginChecked, setDailyLoginChecked] = useState<boolean>(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [tokenBalance, setTokenBalance] = useState<string>("0");

  // Function to fetch the token balance
  const fetchTokenBalance = async (): Promise<void> => {
    if (!publicKey || !connected) return;
    
    try {
      const balance = await TokenService.getTokenBalance(publicKey.toString());
      
      // Format to 2 decimal places
      const formattedBalance = balance.toFixed(2);
      
      setTokenBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };

  // Function to generate a unique avatar URL based on wallet address
  const generateAvatarUrl = (address: string): string => {
    // Generate a unique seed based on the user's address to ensure consistency
    const seed = address.slice(0, 8); // Use part of the address as seed
    return `https://api.dicebear.com/6.x/avataaars/svg?seed=${seed}`;
  };

  const checkDailyLogin = async (currentUser: User) => {
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = currentUser.lastLogin;
    
    // Initialize streak if not present
    if (!currentUser.loginStreak) {
      currentUser.loginStreak = 0;
    }
    
    if (lastLogin !== today) {
      // Check if streak should continue or reset
      let streak = currentUser.loginStreak || 0;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // If last login was yesterday, increment streak
      if (lastLogin === yesterdayStr) {
        streak += 1;
      } 
      // If last login was more than a day ago, reset streak
      else if (lastLogin) {
        streak = 1; // Reset but count today
      } 
      // First time login
      else {
        streak = 1;
      }
      
      // Calculate XP bonus based on streak
      let xpReward = 100; // Base XP reward
      let streakBonus = 0;
      
      if (streak >= 7) {
        streakBonus = 100; // 7+ days streak
      } else if (streak >= 3) {
        streakBonus = 50; // 3-6 days streak
      }
      
      const totalXp = xpReward + streakBonus;
      
      // Update user with new XP and streak info
      const updatedUser: User = {
        ...currentUser,
        xp: currentUser.xp + totalXp,
        lastLogin: today,
        loginStreak: streak
      };
      
      // Calculate new level
      const oldLevel = currentUser.level;
      const newLevel = Math.floor(Math.sqrt(updatedUser.xp / 100)) + 1;
      updatedUser.level = newLevel;
      
      // Update stage if level changed
      if (oldLevel !== newLevel) {
        updatedUser.stage = getUserStage(newLevel) as User['stage'];
      }
      
      // Update user in Firebase
      await saveUser(updatedUser);
      
      // Show toast notification with appropriate message
      if (streak > 1) {
        toast.success(`${streak}-Day Streak! +${totalXp} XP`, {
          description: `You've logged in ${streak} days in a row! Keep it up for more rewards.`,
          duration: 5000,
        });
      } else {
        toast.success(`Daily Login Reward! +${totalXp} XP`, {
          description: `Welcome back! You've earned ${totalXp} XP for logging in today.`,
          duration: 5000,
        });
      }
      
      // Show level up dialog if level changed
      if (oldLevel !== newLevel) {
        setNewLevel(newLevel);
        setShowLevelUp(true);
      }
      
      return updatedUser;
    }
    
    return currentUser;
  };

  // Check connection when wallet status changes
  useEffect(() => {
    if (connected && publicKey) {
      handleWalletConnected(publicKey.toString());
    } else {
      setUser(null);
      setTokenBalance("0");
    }
  }, [connected, publicKey]);

  const handleWalletConnected = async (address: string) => {
    try {
      // Try to get user from Firebase first
      let fbUser = await getUser(address);
      let isNewUser = false;
      
      // If not found in Firebase, create new user
      if (!fbUser) {
        isNewUser = true;
        const newUser: User = {
          id: address,
          address: address,
          xp: 0,
          level: 1,
          stage: "Spark",
          loginStreak: 0,
          tokensEarned: 0,
          tokens: 0,
          timeSaved: 0,
          tasksCompleted: 0,
          insightValue: 0,
          leetcodeVerified: false,
          verificationToken: getRandomToken()
        };
        
        // Generate a unique avatar for the new user
        newUser.avatarUrl = generateAvatarUrl(address);
        
        await saveUser(newUser);
        fbUser = newUser;
      } else if (!fbUser.avatarUrl) {
        // Generate avatar for existing user if they don't have one
        fbUser.avatarUrl = generateAvatarUrl(address);
        await saveUser(fbUser);
      }
      
      // Set stage based on level
      fbUser = {
        ...fbUser,
        stage: getUserStage(fbUser.level) as User['stage']
      };
      
      // Check for daily login if not already checked
      if (!dailyLoginChecked) {
        fbUser = await checkDailyLogin(fbUser);
        setDailyLoginChecked(true);
      }
      
      setUser(fbUser);
      
      // Fetch token balance after user is set
      await fetchTokenBalance();
      
      // Show welcome back toast with stage info if returning user
      if (!isNewUser && fbUser.level > 1) {
        const emoji = getStageEmoji(fbUser.stage);
        toast.success(`Welcome back to InsightQuest!`, {
          description: `You're currently at the ${emoji} ${fbUser.stage} stage. Keep going!`
        });
      } else {
        toast.success('Wallet connected successfully!');
      }
    } catch (error) {
      console.error("Error handling wallet connection:", error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!wallet) {
        toast.error('Please select a wallet first');
        return;
      }
      
      await connect();
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet', {
        description: error.message || 'Please try again or use a different wallet'
      });
    }
  };
  
  const disconnectWallet = () => {
    disconnect();
    setUser(null);
    setTokenBalance("0");
    toast.info('Wallet disconnected');
  };
  
  const updateUsername = async (username: string) => {
    if (!publicKey || !user) return;
    
    const updatedUser: User = {
      ...user,
      username
    };
    
    // Update user in Firebase
    const success = await saveUser(updatedUser);
    
    if (success) {
      setUser(updatedUser);
      toast.success('Username updated successfully!');
    } else {
      toast.error('Failed to update username');
    }
  };

  const addUserXP = async (amount: number) => {
    if (!user?.id) return;
    
    try {
      const result = await updateUserXP(user.id, amount);
      
      if (result.success) {
        // Update local user state with new XP and level
        const updatedUser: User = {
          ...user,
          xp: result.newXP,
          level: result.newLevel,
          stage: getUserStage(result.newLevel) as User['stage']
        };
        
        setUser(updatedUser);
        
        // Show toast notification for XP gain
        toast.success(`+${amount} XP earned!`);
        
        // Check for level up
        if (result.oldLevel !== result.newLevel) {
          setNewLevel(result.newLevel);
          setShowLevelUp(true);
        }
      }
    } catch (error) {
      console.error("Error adding XP:", error);
    }
  };
  
  const refreshUser = async () => {
    if (publicKey) {
      try {
        // Get fresh user data from Firebase
        let refreshedUser = await getUser(publicKey.toString());
        
        // If not found in Firebase, create new user
        if (!refreshedUser) {
          const address = publicKey.toString();
          refreshedUser = {
            id: address,
            address: address,
            xp: 0,
            level: 1,
            stage: "Spark",
            loginStreak: 0,
            tokensEarned: 0,
            tokens: 0,
            timeSaved: 0,
            tasksCompleted: 0,
            insightValue: 0,
            leetcodeVerified: false,
            avatarUrl: generateAvatarUrl(address)
          };
          
          // Save to Firebase for future use
          await saveUser(refreshedUser);
        } else if (!refreshedUser.avatarUrl) {
          // Generate avatar if missing
          refreshedUser.avatarUrl = generateAvatarUrl(refreshedUser.address);
          await saveUser(refreshedUser);
        }
        
        if (refreshedUser) {
          // Set stage based on level
          refreshedUser = {
            ...refreshedUser,
            stage: getUserStage(refreshedUser.level) as User['stage']
          };
          
          setUser(refreshedUser);
          
          // Also refresh token balance
          await fetchTokenBalance();
        }
      } catch (error) {
        console.error("Error refreshing user:", error);
      }
    }
  };
  
  // Check for token balance updates periodically
  useEffect(() => {
    if (connected && publicKey) {
      // Initial fetch
      fetchTokenBalance();
      
      // Set up periodic refresh (every 30 seconds)
      const intervalId = setInterval(() => {
        fetchTokenBalance();
      }, 30000);
      
      // Clean up interval
      return () => clearInterval(intervalId);
    }
  }, [connected, publicKey]);
  
  return (
    <Web3Context.Provider 
      value={{ 
        isConnected: connected, 
        connecting: connecting, 
        address: publicKey?.toString() || null, 
        user,
        connectWallet, 
        disconnectWallet,
        refreshUser,
        updateUsername,
        addUserXP,
        tokenBalance,
        fetchTokenBalance
      }}
    >
      {children}
      
      {/* Level Up Dialog */}
      <LevelUpDialog 
        level={newLevel}
        open={showLevelUp}
        onOpenChange={setShowLevelUp}
      />
    </Web3Context.Provider>
  );
};

// Add TypeScript interface for Solana window object
declare global {
  interface Window {
    solana?: any;
  }
}

// Export the provider for use in App.tsx
export const Web3Provider = Web3ProviderWrapper;