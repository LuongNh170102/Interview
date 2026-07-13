import React from "react";
import { type IJwtContext } from "@/types";
const JwtContext = React.createContext<IJwtContext>({
  isLoggedIn: true,
  user: null
});
export { JwtContext };
