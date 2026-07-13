import { type IUser } from "./user.type";

type IJwtContext = {
  isLoggedIn: boolean;
  user: IUser | null;
};
export { type IJwtContext };
