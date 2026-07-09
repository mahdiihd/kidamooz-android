export interface Story {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  audioUrl: string;
  durationSeconds: number;
  ageMin: number;
  ageMax: number;
  categoryId: string;
}

export interface StoryChapter {
  title: string;
  startSeconds: number;
  imageUrl: string;
}

export interface StoryDetail extends Story {
  chapters?: StoryChapter[];
}
