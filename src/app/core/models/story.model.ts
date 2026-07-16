export interface Story {
  id: string;
  title: string;
  titleFa: string;
  titleEn: string;
  description: string;
  descriptionFa: string;
  descriptionEn: string;
  coverUrl: string;
  audioUrl: string;
  durationSeconds: number;
  ageMin: number;
  ageMax: number;
  categoryId: string;
  progressIcon?: string;
  featured?: boolean;
  sortOrder?: number;
}

export interface StoryChapter {
  title: string;
  titleFa: string;
  titleEn: string;
  startSeconds: number;
  imageUrl: string;
}

export interface StoryDetail extends Story {
  chapters?: StoryChapter[];
}
