import { ObjectId } from "typeorm";
import { IUser } from "./user.type";
type IComment = {
  id: number;
  user_id: number;
  comment_parent_id: number;
  display_message: string;
  created_at: Date;
  user: IUser;
};
export { IComment };
