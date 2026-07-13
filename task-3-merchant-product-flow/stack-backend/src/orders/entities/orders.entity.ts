import { Column, PrimaryGeneratedColumn } from "typeorm";

class Orders {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  ordersCode?: string;

  @Column()
  ordersDate?: Date;

  @Column()
  customerName?: string;

  @Column()
  customerPhone?: string;

  @Column()
  customerEmail?: string;

  @Column()
  customerAddress?: string;
}
export { Orders };
