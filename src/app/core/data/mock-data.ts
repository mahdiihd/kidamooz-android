import { Category } from '../models/category.model';
import { StoryDetail } from '../models/story.model';
import { CATEGORY_IMAGES, STORY_IMAGES } from './story-images';

const audioSample =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3';

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'forest',
    title: 'جنگل جادویی',
    slug: 'forest',
    iconUrl: CATEGORY_IMAGES.forest,
    color: '#7bc950',
  },
  {
    id: 'space',
    title: 'سفر به فضا',
    slug: 'space',
    iconUrl: CATEGORY_IMAGES.space,
    color: '#d4a5f9',
  },
  {
    id: 'ocean',
    title: 'اعماق دریا',
    slug: 'ocean',
    iconUrl: CATEGORY_IMAGES.ocean,
    color: '#ff8a65',
  },
  {
    id: 'animals',
    title: 'دوستان حیوانی',
    slug: 'animals',
    iconUrl: CATEGORY_IMAGES.animals,
    color: '#ef476f',
  },
];

export const MOCK_STORIES: StoryDetail[] = [
  {
    id: '1',
    title: 'خرگوش کوچولوی خواب‌آلود',
    description: 'خرگوش کوچولو قبل از خواب، ستاره‌ها رو می‌شماره.',
    coverUrl: STORY_IMAGES.sleepyRabbit,
    audioUrl: audioSample,
    durationSeconds: 420,
    ageMin: 3,
    ageMax: 6,
    categoryId: 'forest',
  },
  {
    id: '2',
    title: 'ماه و پنگوئن',
    description: 'پنگوئن کوچولو با ماه دوست می‌شه.',
    coverUrl: STORY_IMAGES.moonPenguin,
    audioUrl: audioSample,
    durationSeconds: 360,
    ageMin: 4,
    ageMax: 7,
    categoryId: 'ocean',
  },
  {
    id: '3',
    title: 'موشک رویایی',
    description: 'سفر شبانه به کهکشان رنگی.',
    coverUrl: STORY_IMAGES.dreamRocket,
    audioUrl: audioSample,
    durationSeconds: 480,
    ageMin: 5,
    ageMax: 8,
    categoryId: 'space',
  },
  {
    id: '4',
    title: 'شیر مهربون',
    description: 'شیر کوچولو یاد می‌گیره مهربون باشه.',
    coverUrl: STORY_IMAGES.kindLion,
    audioUrl: audioSample,
    durationSeconds: 300,
    ageMin: 3,
    ageMax: 6,
    categoryId: 'animals',
  },
  {
    id: '5',
    title: 'جغد دانا',
    description: 'جغد کوچولو شب‌ها قصه می‌گه.',
    coverUrl: STORY_IMAGES.wiseOwl,
    audioUrl: audioSample,
    durationSeconds: 390,
    ageMin: 4,
    ageMax: 8,
    categoryId: 'forest',
  },
  {
    id: '6',
    title: 'ستاره گمشده',
    description: 'کودک کوچولو ستاره گمشده رو پیدا می‌کنه.',
    coverUrl: STORY_IMAGES.lostStar,
    audioUrl: audioSample,
    durationSeconds: 450,
    ageMin: 5,
    ageMax: 8,
    categoryId: 'space',
  },
];
