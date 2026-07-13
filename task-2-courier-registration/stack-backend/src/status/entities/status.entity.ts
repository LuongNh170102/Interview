import { Column, PrimaryGeneratedColumn } from "typeorm";
class Status {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column()
  tag_name: string | undefined;
}
export { Status };
