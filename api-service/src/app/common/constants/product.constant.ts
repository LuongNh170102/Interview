export const PRODUCT_CONSTANTS = {
  STORAGE_FOLDER: 'products',
  METADATA: {
    IMAGES: 'images',
    THUMBNAIL: 'thumbnail',
  },
  PUBLIC_LIST_CACHE_TTL_MS: 60_000,
} as const;

export const PRODUCT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;
