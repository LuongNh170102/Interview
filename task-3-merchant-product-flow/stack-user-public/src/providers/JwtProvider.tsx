import { JwtContext } from "@/context";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { loginAction, logoutAction } from "@/slices";
import { AxiosService, getCookie, getExpired } from "@/utils";
import React from "react";
const JwtProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user, isLoggedIn } = useAppSelector((state) => state.account);
  return <JwtContext value={{ isLoggedIn, user }}>{children}</JwtContext>;
};
export { JwtProvider };
