const pexels = (photoId: number, width: number, height: number): string =>
  `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`;

const pexelsAlt = (photoId: number, width: number, height: number): string =>
  `https://images.pexels.com/photos/${photoId}/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`;

export const CATEGORY_IMAGES = {
  forest: pexels(1444442, 400, 400),
  space: pexels(1252890, 400, 400),
  ocean: pexels(1287145, 400, 400),
  animals: pexels(4587993, 400, 400),
} as const;

export const STORY_IMAGES = {
  sleepyRabbit: pexels(326012, 600, 750),
  moonPenguin: pexels(892636, 600, 750),
  dreamRocket: pexelsAlt(23769, 600, 750),
  kindLion: pexels(247373, 600, 750),
  wiseOwl: pexels(1661544, 600, 750),
  lostStar: pexels(1252869, 600, 750),
} as const;
