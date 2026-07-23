export interface MemberProfile {
  id: string;
  mobile: string;
  displayName: string;
}

export interface MemberAuthResponse {
  accessToken: string;
  user: MemberProfile;
}

export interface StoryDraft {
  id: string;
  status: string;
  drawingUrl: string | null;
  coverUrl: string | null;
  usedFallbackCover: boolean;
  titleFa: string;
  descriptionFa: string;
  storyScript: string;
  challengeTag: string | null;
  audioUrl: string | null;
  durationSeconds: number | null;
  publishedStoryId: string | null;
  errorMessage: string | null;
  rejectReason: string | null;
  authorName: string | null;
  authorMobile: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  canRemoveFromProfile: boolean;
}

export interface StoryDraftQuota {
  canCreateToday: boolean;
  dailyLimit: number;
  usedToday: number;
  nextAvailableAt: string | null;
  planTier: string;
  isPlus: boolean;
}
