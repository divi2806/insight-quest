
import { useState, useEffect } from "react";
import { 
  Trophy, 
  Award, 
  Search,
  Clock,
  CircleDollarSign,
  SortAsc,
  SortDesc
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import MainLayout from "@/components/layout/MainLayout";
import { generateMockLeaderboard } from "@/lib/mockData";
import { LeaderboardEntry } from "@/types";
import { shortenAddress } from "@/lib/web3Utils";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "tokensEarned",
    direction: "desc" as "asc" | "desc"
  });

  useEffect(() => {
    // Load the leaderboard data
    const mockLeaderboard = generateMockLeaderboard();
    setLeaderboard(mockLeaderboard);
    setFilteredLeaderboard(mockLeaderboard);
  }, []);

  useEffect(() => {
    const filtered = leaderboard.filter(entry => {
      const username = entry.username?.toLowerCase() || "";
      const address = entry.address.toLowerCase();
      const query = searchQuery.toLowerCase();
      return username.includes(query) || address.includes(query);
    });
    
    // Sort the filtered list
    const sorted = [...filtered].sort((a, b) => {
      // @ts-ignore
      const valueA = a[sortConfig.key];
      // @ts-ignore
      const valueB = b[sortConfig.key];
      
      if (valueA === valueB) {
        // Secondary sort by tokensEarned if values are equal
        return sortConfig.direction === "asc" 
          ? a.tokensEarned - b.tokensEarned
          : b.tokensEarned - a.tokensEarned;
      }
      
      return sortConfig.direction === "asc" 
        ? valueA - valueB 
        : valueB - valueA;
    });
    
    // Update ranks after sorting
    const rankedLeaderboard = sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
    
    setFilteredLeaderboard(rankedLeaderboard);
  }, [searchQuery, leaderboard, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "desc" ? "asc" : "desc"
    }));
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-gray-400">See who's earning the most rewards</p>
        </div>
        
        {/* Top 3 */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredLeaderboard.slice(0, 3).map((entry, index) => (
              <div 
                key={index} 
                className={`glass-card rounded-lg p-6 text-center ${index === 0 ? "purple-glow" : ""}`}
              >
                <div className="mb-4 flex justify-center">
                  <div className="relative">
                    <div 
                      className={`w-20 h-20 rounded-full overflow-hidden border-4 ${
                        index === 0 ? "border-yellow-400" : 
                        index === 1 ? "border-gray-400" : "border-amber-700"
                      }`}
                    >
                      <Avatar className="w-full h-full">
                        <AvatarImage src={entry.avatarUrl} />
                        <AvatarFallback>{entry.username?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div 
                      className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? "bg-yellow-400" : 
                        index === 1 ? "bg-gray-400" : "bg-amber-700"
                      }`}
                    >
                      {entry.rank}
                    </div>
                  </div>
                </div>
                
                <h3 className="font-semibold text-lg mb-1">{entry.username || shortenAddress(entry.address)}</h3>
                <p className="text-sm text-gray-400 mb-3">{shortenAddress(entry.address)}</p>
                
                <div className="flex justify-center gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Level</p>
                    <p className="font-bold text-brand-purple">{entry.level}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Tasks</p>
                    <p className="font-bold">{entry.tasksCompleted}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-lg font-bold text-yellow-400">
                  <Award className="h-5 w-5" />
                  <span>{entry.tokensEarned}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Search & Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              className="pl-10" 
              placeholder="Search by username or address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="tokens" className="w-full sm:w-72">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="level">Level</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="value">Value</TabsTrigger>
            </TabsList>
            <TabsContent value="tokens" className="hidden">
              Sorting by tokens earned
            </TabsContent>
            <TabsContent value="level" className="hidden">
              Sorting by level achieved
            </TabsContent>
            <TabsContent value="tasks" className="hidden">
              Sorting by tasks completed
            </TabsContent>
            <TabsContent value="value" className="hidden">
              Sorting by insight value
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Main Leaderboard */}
        <div className="glass-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-brand-purple/10">
                  <th className="py-3 px-4 text-left">Rank</th>
                  <th className="py-3 px-4 text-left">User</th>
                  <th className="py-3 px-4 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 flex items-center gap-1"
                      onClick={() => handleSort("level")}
                    >
                      Level
                      {sortConfig.key === "level" && (
                        sortConfig.direction === "asc" ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </Button>
                  </th>
                  <th className="py-3 px-4 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 flex items-center gap-1"
                      onClick={() => handleSort("tokensEarned")}
                    >
                      Tokens
                      {sortConfig.key === "tokensEarned" && (
                        sortConfig.direction === "asc" ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </Button>
                  </th>
                  <th className="py-3 px-4 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 flex items-center gap-1"
                      onClick={() => handleSort("insightValue")}
                    >
                      Value
                      {sortConfig.key === "insightValue" && (
                        sortConfig.direction === "asc" ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </Button>
                  </th>
                  <th className="py-3 px-4 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 flex items-center gap-1"
                      onClick={() => handleSort("tasksCompleted")}
                    >
                      Tasks
                      {sortConfig.key === "tasksCompleted" && (
                        sortConfig.direction === "asc" ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </Button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((entry) => (
                  <tr 
                    key={entry.address} 
                    className="border-b border-brand-purple/10 hover:bg-brand-purple/5"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {entry.rank <= 3 ? (
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            entry.rank === 1 ? "bg-yellow-400" : 
                            entry.rank === 2 ? "bg-gray-400" : "bg-amber-700"
                          } text-black`}>
                            {entry.rank}
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-brand-purple/10 flex items-center justify-center text-xs">
                            {entry.rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.avatarUrl} />
                          <AvatarFallback className="bg-brand-dark-lighter text-brand-purple">
                            {entry.username?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {entry.username || shortenAddress(entry.address)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {shortenAddress(entry.address)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Badge variant="outline" className="bg-brand-purple/10 text-brand-purple border-brand-purple/20">
                        {entry.level}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1 text-yellow-400">
                        <Award className="h-4 w-4" />
                        <span className="font-medium">{entry.tokensEarned}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1 text-green-500">
                        <CircleDollarSign className="h-4 w-4" />
                        <span className="font-medium">${entry.insightValue}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{entry.tasksCompleted}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredLeaderboard.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No users found matching your search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Leaderboard;
