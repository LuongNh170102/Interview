import { Column, PrimaryGeneratedColumn } from "typeorm";
class Product {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  sku?: string;

  @Column()
  productName?: string;

  @Column()
  price?: number;

  @Column()
  featuredImage?: string;
}
export { Product };
