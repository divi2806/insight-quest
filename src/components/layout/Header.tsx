import { Link, useLocation } from "react-router-dom";
import { 
  Wallet, 
  Trophy, 
  Home, 
  Info,
  Menu, 
  X, 
  User, 
  BarChart,
  MessageSquare,
  ChevronDown,
  Building,
  Medal,
  Coins,
  RefreshCw,
  Shield,
  Check,
  Loader2
} from "lucide-react";
import { useState } from 'react';

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWeb3 } from "@/contexts/Web3Context";
import { shortenAddress } from "@/lib/web3Utils";
import NavLinks from "./NavLinks";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import WalletButton from "./WalletButton";

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const Header = ({ mobileMenuOpen, setMobileMenuOpen }: HeaderProps) => {
  const location = useLocation();
  const { 
    isConnected, 
    address, 
    user, 
    connectWallet, 
    disconnectWallet, 
    tokenBalance, 
    fetchTokenBalance,
    signatureVerified,
    verifyingSignature,
    verifySignature,
    airdropInProgress
  } = useWeb3();

  // Render different views based on connection and verification status
  const renderUserSection = () => {
    // Not connected
    if (!isConnected) {
      return <WalletButton className="gap-1 purple-gradient" />;
    }
    
    // Connected but not verified
    if (isConnected && !signatureVerified) {
      return (
        <Button 
          variant="outline" 
          className="purple-glow-hover border-brand-purple/50 flex items-center gap-1"
          onClick={verifySignature}
          disabled={verifyingSignature}
        >
          {verifyingSignature ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              <span>Verify Signature</span>
            </>
          )}
        </Button>
      );
    }
    
    // Connected and verified but airdrop in progress
    if (isConnected && signatureVerified && airdropInProgress) {
      return (
        <Button 
          variant="outline" 
          className="purple-glow-hover border-brand-purple/50 flex items-center gap-1"
          disabled={true}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Airdropping Tokens...</span>
        </Button>
      );
    }
    
    // Connected and verified - show full user profile section
    return (
      <div className="hidden md:flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="px-3 py-1.5 rounded-full bg-brand-dark-lighter text-xs font-medium border border-yellow-500/20 flex items-center gap-1 group">
                <Coins className="h-3 w-3 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">
                  {tokenBalance}
                </span>
                <span className="text-gray-400">$TASK</span>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    fetchTokenBalance();
                  }}
                  className="ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Your current TASK token balance</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {user?.stage && (
          <div className="px-2 py-1 rounded-full bg-brand-dark-lighter text-xs font-medium border border-brand-purple/20 flex items-center gap-1">
            <Medal className="h-3 w-3 text-brand-purple" />
            <span>{user.stage}</span>
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-brand-dark-lighter/50 transition-colors">
              <Avatar className="h-8 w-8 border border-brand-purple/30 ring-2 ring-brand-purple/10">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-brand-dark-lighter text-brand-purple">
                  {user?.username?.[0] || user?.address?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center">
                <span className="text-sm font-medium mr-1">
                  {user?.username || shortenAddress(address || "")}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-card border-brand-purple/20">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span>{user?.username || "User"}</span>
                  {signatureVerified && (
                    <Check className="h-4 w-4 ml-1 text-green-500" />
                  )}
                </div>
                <span className="text-xs text-gray-400">{shortenAddress(address || "")}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-brand-purple/10" />
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link to="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link to="/dashboard" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link to="/chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Chat with Zappy</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-brand-purple/10" />
            <DropdownMenuItem className="cursor-pointer text-red-500" onClick={disconnectWallet}>
              <Wallet className="h-4 w-4 mr-2" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-brand-purple/20 bg-brand-dark-darker/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-r from-brand-purple to-brand-purple-dark purple-glow group-hover:animate-pulse transition-all duration-300">
              <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
                IQ
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-purple to-brand-purple-dark text-transparent bg-clip-text group-hover:from-brand-purple-dark group-hover:to-brand-purple transition-all duration-300">
              InsightQuest
            </span>
          </Link>
        </div>

        <NavLinks className="hidden md:flex" />

        <div className="flex items-center gap-2">
          {renderUserSection()}
          
          <button 
            className="block md:hidden p-2 text-gray-400"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
