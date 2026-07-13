import { JwtContext } from "@/context";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { loginAction, logoutAction } from "@/slices";
import { AxiosService } from "@/utils";
import React from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
const Toast = Swal.mixin({
  toast: true,
  position: "bottom-start",
  showConfirmButton: false,
  timer: 8000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});
const JwtProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { user, isLoggedIn } = useAppSelector((state) => state.account);
  React.useEffect(() => {
    const init = () => {
      const token: string | null = localStorage.getItem(import.meta.env.VITE_ACCESS_TOKEN_PREFIX as string);
      if (token) {
        AxiosService()
          .post(
            "/auth/check-valid-token",
            { token },
            {
              headers: { isShowLoading: false }
            }
          )
          .then((response: any) => {
            const { statusCode, data } = response.data;
            if (parseInt(statusCode) >= 200 && parseInt(statusCode) <= 299) {
              const { user } = data;
              dispatch(loginAction(user));
            } else {
              removeLocalStorageLogout();
            }
          })
          .catch((err: any) => {
            Toast.fire({
              icon: "error",
              title: t(err?.data?.message)
            });
          });
      } else {
        removeLocalStorageLogout();
      }
    };
    init();
  }, []);
  const removeLocalStorageLogout = () => {
    localStorage.removeItem(import.meta.env.VITE_ACCESS_TOKEN_PREFIX);
    dispatch(logoutAction());
  };
  return <JwtContext.Provider value={{ isLoggedIn, user }}>{children}</JwtContext.Provider>;
};
export { JwtProvider };
