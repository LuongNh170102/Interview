import { Column, PrimaryGeneratedColumn } from "typeorm";

class Courier {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column()
  status_id: number | undefined;

  @Column()
  email: string | undefined;

  @Column()
  firstname: string | undefined;

  @Column()
  lastname: string | undefined;
}
export { Courier };
