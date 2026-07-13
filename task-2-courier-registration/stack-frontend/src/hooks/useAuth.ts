import React from "react";
import { JwtContext } from "@/context";
const useAuth = () => {
  const context = React.useContext(JwtContext);
  return context;
};
export { useAuth };
