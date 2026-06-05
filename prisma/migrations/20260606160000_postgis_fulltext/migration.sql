-- PostGIS for courier geo queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Full-text search vector for products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

UPDATE "products"
SET "search_vector" =
  setweight(to_tsvector('simple', coalesce("sku", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("name"->>'vi', '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("name"->>'en', '')), 'B')
WHERE "search_vector" IS NULL;

CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.sku, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.name->>'vi', '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.name->>'en', '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_search_vector_trigger ON "products";
CREATE TRIGGER products_search_vector_trigger
BEFORE INSERT OR UPDATE OF sku, name ON "products"
FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

CREATE INDEX IF NOT EXISTS "products_search_vector_idx" ON "products" USING GIN ("search_vector");
