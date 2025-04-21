
export type User = {
  id: string;
  address: string;
  username?: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  tokensEarned: number;
  tokens: number;
  timeSaved: number;
  tasksCompleted: number;
  insightValue: number;
  leetcodeVerified: boolean;
  leetcodeUsername?: string;
  verificationToken?: string;
  stage: "Spark" | "Glow" | "Blaze" | "Nova" | "Orbit";
  lastLogin?: string;
  loginStreak?: number;
};

export type Task = {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: "leetcode" | "course" | "video";
  status: "pending" | "completed" | "verified";
  reward: number;
  xpReward: number;
  url?: string;
  dateCreated: string;
  dateCompleted?: string;
  platformId?: string;
};

export type LeaderboardEntry = {
  address: string;
  username?: string;
  avatarUrl?: string;
  level: number;
  tokensEarned: number;
  insightValue: number;
  tasksCompleted: number;
  rank: number;
  stage: "Spark" | "Glow" | "Blaze" | "Nova" | "Orbit";
};

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  ratingCount: number;
  creatorId: string;
  creatorName: string;
  creatorAvatarUrl: string;
  imageUrl: string;
  githubUrl?: string;
  downloadUrl?: string;
  purchasedBy?: string[];
  dateCreated: string;
  createdBy?: string; // Added this property to match usage in firebase.ts
}

