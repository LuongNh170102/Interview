import styles from "@/assets/scss/homepage.module.scss";
import { useAppDispatch } from "@/hooks";
import { loginAction } from "@/slices";
import { AxiosService, getExpired } from "@/utils";
import { clsx } from "clsx";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
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
type IFormInput = {
  username: string;
  password: string;
};
const LoginPage = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<IFormInput>({
    defaultValues: {
      username: "",
      password: ""
    }
  });
  const onSubmit: SubmitHandler<IFormInput> = (dataFrm) => {
    const { username, password } = dataFrm;
    AxiosService()
      .post("/auth/login", { username, password }, { headers: { isShowLoading: true } })
      .then((response: any) => {
        const { statusCode, message, data } = response.data;
        if (parseInt(statusCode) >= 200 && parseInt(statusCode) <= 299) {
          const { user, token } = data;
          if (user && token) {
            localStorage.setItem(import.meta.env.VITE_ACCESS_TOKEN_PREFIX, token);
            Toast.fire({
              icon: "success",
              title: t(message)
            });
            setTimeout(() => {
              dispatch(loginAction(user));
            }, 2000);
          }
        } else {
          localStorage.removeItem(import.meta.env.VITE_ACCESS_TOKEN_PREFIX);
          Toast.fire({
            icon: "warning",
            title: t(message && Array.isArray(message) ? (message[0] as string) : message)
          });
        }
      })
      .catch((err: any) => {
        Toast.fire({
          icon: "error",
          title: t(err?.data?.message)
        });
      });
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} name="loginFrm">
      <div className={clsx(["flex", "justify-center", "items-center", "w-screen", "h-screen", "bg-center", "bg-no-repeat", "bg-cover", styles.wrapper])}>
        <div className={clsx(["w-110", "pt-8", "pb-8", "pl-10", "pr-10", "border-2", "rounded-lg", styles.container])}>
          <h3 className={clsx(["text-center", "text-white", "uppercase", "text-3xl", "mb-10"])}>{t("Login")}</h3>
          <div className={clsx(["flex", "flex-col", "gap-y-8"])}>
            <Controller
              name="username"
              defaultValue=""
              control={control}
              render={({ field }) => {
                return (
                  <div>
                    <input
                      type="text"
                      {...field}
                      className={clsx(["border", "border-gray-400", "w-full", "rounded-4xl", "outline-0", "pt-3", "pb-3", "text-white", "pl-6", "pr-6", "bg-transparent"])}
                      placeholder={t("Username")}
                    />
                    {errors.username && <div className={clsx(["text-red-400", "mt-2", "pl-6", "pr-6", "text-sm"])}>{errors.username.message}</div>}
                  </div>
                );
              }}
            />
            <Controller
              name="password"
              defaultValue=""
              control={control}
              render={({ field }) => {
                return (
                  <div>
                    <input
                      type="password"
                      {...field}
                      className={clsx(["border", "border-gray-400", "w-full", "rounded-4xl", "outline-0", "pt-3", "pb-3", "text-white", "pl-6", "pr-6", "bg-transparent"])}
                      placeholder={t("Password")}
                    />
                    {errors.password && <div className={clsx(["text-red-400", "mt-2", "pl-6", "pr-6", "text-sm"])}>{errors.password.message}</div>}
                  </div>
                );
              }}
            />
            <div className={clsx(["flex", "justify-center"])}>
              <button type="submit" className={clsx(["bg-white", "pl-7", "pr-7", "pt-2", "pb-2", "rounded-3xl", "shadow-2xl", "hover:bg-gray-200", "cursor-pointer"])}>
                {t("Login")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default LoginPage;
