import { JwtContext } from "@/context";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { loginAction, logoutAction } from "@/slices";
import { AxiosService } from "@/utils";
import { type FunctionComponent, type PropsWithChildren, useEffect } from "react";
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
const JwtProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { user, isLoggedIn } = useAppSelector((state) => state.account);
  useEffect(() => {
    const init = () => {
      let token: string | null = localStorage.getItem(import.meta.env.VITE_ACCESS_TOKEN_PREFIX as string);
      if (token) {
        AxiosService()
          .put(
            "/auth/check-valid-token",
            { token },
            {
              headers: { isShowLoading: false }
            }
          )
          .then((response: any) => {
            const { data } = response.data;
            const { user } = data;
            if (user) {
              dispatch(loginAction(user));
            } else {
              removeLocalStorageLogout();
            }
          })
          .catch(() => {
            token = localStorage.getItem(import.meta.env.VITE_REFRESH_TOKEN_PREFIX as string);
            if (token) {
              AxiosService()
                .put("/auth/refresh-token", { token }, { headers: { isShowLoading: false } })
                .then((response: any) => {
                  const { data } = response.data;
                  const { user, accessToken } = data;
                  localStorage.setItem(import.meta.env.VITE_ACCESS_TOKEN_PREFIX, accessToken);
                  dispatch(loginAction(user));
                })
                .catch((error: any) => {
                  removeLocalStorageLogout();
                  Toast.fire({
                    icon: "error",
                    title: t(error?.data?.message)
                  });
                });
            }
          });
      } else {
        removeLocalStorageLogout();
      }
    };
    init();
  }, []);
  const removeLocalStorageLogout = () => {
    localStorage.removeItem(import.meta.env.VITE_ACCESS_TOKEN_PREFIX);
    localStorage.removeItem(import.meta.env.VITE_REFRESH_TOKEN_PREFIX);
    dispatch(logoutAction());
  };
  return <JwtContext.Provider value={{ isLoggedIn, user }}>{children}</JwtContext.Provider>;
};
export { JwtProvider };
