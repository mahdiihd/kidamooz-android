export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  avatarKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemberEngagement {
  listenStreak: number;
  createStreak: number;
  lastPlayedStoryId: string | null;
  lastPlayedPositionSeconds: number | null;
  planTier: 'free' | 'plus' | string;
  plusExpiresAt: string | null;
  canDownloadOffline: boolean;
  adsEnabled: boolean;
  dailyCreateLimit: number;
}

export interface StoryOfTheDay {
  pickDate: string;
  storyId: string;
  titleFa: string;
  coverUrl: string | null;
  durationSeconds: number;
}

export interface WeeklyChallenge {
  id: string;
  titleFa: string;
  themeTag: string;
  descriptionFa: string;
  weekStart: string;
  weekEnd: string;
}
