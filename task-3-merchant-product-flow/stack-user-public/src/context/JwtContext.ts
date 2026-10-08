"use client";
import { IJwtContext } from "@/types";
import React from "react";
const JwtContext = React.createContext<IJwtContext>({
  isLoggedIn: true,
  user: null
});
export { JwtContext };
