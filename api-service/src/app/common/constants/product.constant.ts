export const PRODUCT_CONSTANTS = {
  STORAGE_FOLDER: 'products',
  METADATA: {
    IMAGES: 'images',
    THUMBNAIL: 'thumbnail',
  },
} as const;

export enum PRODUCT_STATUS {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}