export const PRODUCT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export const PRODUCT_CONSTANTS = {
  STORAGE_FOLDER: 'products',
  METADATA: {
    IMAGES: 'images',
    THUMBNAIL: 'thumbnail',
  },
  STATUS: PRODUCT_STATUS,
} as const;
