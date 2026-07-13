import { Column, PrimaryGeneratedColumn } from "typeorm";

class Users {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column()
  email?: string;

  @Column()
  password?: string;

  @Column()
  fullname?: string;

  @Column()
  phone?: string;
}
export { Users };
