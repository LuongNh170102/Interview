import { Column, PrimaryGeneratedColumn } from "typeorm";

class Order {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column()
  courier_id: number | undefined;

  @Column()
  courier_firstname: string | undefined;

  @Column()
  courier_lastname: string | undefined;

  @Column()
  order_sku: string | undefined;

  @Column()
  order_date: string | undefined;

  @Column()
  customer_name: string | undefined;

  @Column()
  customer_phone: string | undefined;

  @Column()
  customer_address: string | undefined;
}
export { Order };
