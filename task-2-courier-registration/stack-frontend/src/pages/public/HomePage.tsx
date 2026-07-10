import { clsx } from "clsx";
import styles from "@/assets/scss/homepage.module.scss";
import { useTranslation } from "react-i18next";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
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
  password_confirmed: string;
  fullname: string;
  email: string;
  phone: string;
  remember_me: string;
};
const HomePage = () => {
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
  const onSubmit: SubmitHandler<IFormInput> = (dataFrm) => {};
  return (
    <form onSubmit={handleSubmit(onSubmit)} name="loginFrm">
      <div className={clsx(["flex", "justify-center", "items-center", "w-screen", "h-screen", "bg-center", "bg-no-repeat", "bg-cover", styles.wrapper])}>
        <div className={clsx(["w-110", "pt-8", "pb-8", "pl-10", "pr-10", "border-2", "rounded-lg", styles.container])}>
          <h3 className={clsx(["text-center", "text-white", "uppercase", "text-3xl", "mb-10"])}>{t("Register")}</h3>
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
            <Controller
              name="password_confirmed"
              defaultValue=""
              control={control}
              render={({ field }) => {
                return (
                  <div>
                    <input
                      type="password"
                      {...field}
                      className={clsx(["border", "border-gray-400", "w-full", "rounded-4xl", "outline-0", "pt-3", "pb-3", "text-white", "pl-6", "pr-6", "bg-transparent"])}
                      placeholder={t("Confirm password")}
                    />
                    {errors.password_confirmed && <div className={clsx(["text-red-400", "mt-2", "pl-6", "pr-6", "text-sm"])}>{errors.password_confirmed.message}</div>}
                  </div>
                );
              }}
            />
            <Controller
              name="fullname"
              defaultValue=""
              control={control}
              render={({ field }) => {
                return (
                  <div>
                    <input
                      type="text"
                      {...field}
                      className={clsx(["border", "border-gray-400", "w-full", "rounded-4xl", "outline-0", "pt-3", "pb-3", "text-white", "pl-6", "pr-6", "bg-transparent"])}
                      placeholder={t("Fullname")}
                    />
                    {errors.fullname && <div className={clsx(["text-red-400", "mt-2", "pl-6", "pr-6", "text-sm"])}>{errors.fullname.message}</div>}
                  </div>
                );
              }}
            />
            <Controller
              name="email"
              defaultValue=""
              control={control}
              render={({ field }) => {
                return (
                  <div>
                    <input
                      type="text"
                      {...field}
                      className={clsx(["border", "border-gray-400", "w-full", "rounded-4xl", "outline-0", "pt-3", "pb-3", "text-white", "pl-6", "pr-6", "bg-transparent"])}
                      placeholder={t("Email")}
                    />
                    {errors.email && <div className={clsx(["text-red-400", "mt-2", "pl-6", "pr-6", "text-sm"])}>{errors.email.message}</div>}
                  </div>
                );
              }}
            />
            <Controller
              name="phone"
              defaultValue=""
              control={control}
              render={({ field }) => {
                return (
                  <div>
                    <input
                      type="text"
                      {...field}
                      className={clsx(["border", "border-gray-400", "w-full", "rounded-4xl", "outline-0", "pt-3", "pb-3", "text-white", "pl-6", "pr-6", "bg-transparent"])}
                      placeholder={t("Phone")}
                    />
                    {errors.phone && <div className={clsx(["text-red-400", "mt-2", "pl-6", "pr-6", "text-sm"])}>{errors.phone.message}</div>}
                  </div>
                );
              }}
            />
            <div className={clsx(["flex", "justify-center"])}>
              <button type="submit" className={clsx(["bg-white", "pl-7", "pr-7", "pt-2", "pb-2", "rounded-3xl", "shadow-2xl", "hover:bg-gray-200", "cursor-pointer"])}>
                {t("Register")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default HomePage;
