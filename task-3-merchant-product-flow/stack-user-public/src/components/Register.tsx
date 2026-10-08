import { Logo } from "@/components";
import { faEye, faKey, faMailBulk, faMobile, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import Image from "next/image";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import Swal from "sweetalert2";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { AxiosService } from "@/utils";
import { useTranslations } from "next-intl";
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
  fullname: string;
  mobile: string;
  email: string;
  password: string;
  passwordConfirmed: string;
};
const Register = () => {
  const t = useTranslations("page_translate");
  const schema = yup
    .object({
      fullname: yup.string().required(t("field_required")),
      mobile: yup.string().required(t("field_required")),
      email: yup.string().email("email_invalid").required(t("field_required")),
      password: yup.string().required(t("field_required")),
      passwordConfirmed: yup
        .string()
        .oneOf([yup.ref("password"), null], t("password_not_match"))
        .required(t("field_required"))
    })
    .required();
  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<IFormInput>({
    defaultValues: {
      fullname: "",
      mobile: "",
      email: "",
      password: "",
      passwordConfirmed: ""
    },
    resolver: yupResolver(schema)
  });
  const onSubmit: SubmitHandler<IFormInput> = (dataFrm) => {
    const { fullname, mobile, email, password, passwordConfirmed } = dataFrm;
    AxiosService()
      .post("/customer/create", { fullname, mobile, email, password, passwordConfirmed }, { headers: { isShowLoading: true } })
      .then((response: any) => {
        console.log("response = ", response);
        const { statusCode, data } = response.data;
        if (parseInt(statusCode) >= 200 && parseInt(statusCode) < 299) {
          Toast.fire({
            icon: "success",
            title: t("Create customer successfully")
          });
        }
      })
      .catch((err: any) => {
        Toast.fire({
          icon: "error",
          title: t("Error")
        });
      });
  };
  return (
    <div className={clsx(["w-full", "h-full", "flex"])}>
      <div className={clsx(["h-full", "w-85", "rounded-tl-md", "rounded-bl-md", "bg-[#FFECEB]", "px-4", "py-4"])}>
        <div className={clsx(["text-2xl", "font-bold"])}>
          <Logo />
        </div>
        <Image src="/cover.800e56db.png" alt="Web" width={600} height={400} className={clsx(["w-full", "mt-40"])} />
      </div>
      <div className={clsx(["h-full", "grow", "rounded-tr-md", "rounded-br-md", "bg-white", "px-8", "py-8"])}>
        <h3 className={clsx(["text-lg"])}>{t("Say hello")}</h3>
        <h4 className={clsx(["text-2xl", "mt-3"])}>{t("Register")}</h4>
        <form className={clsx(["mt-6"])} onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="fullname"
            defaultValue=""
            control={control}
            render={({ field }) => {
              return (
                <div>
                  <div className={clsx(["relative"])}>
                    <div className={clsx(["absolute", "top-0", "left-2", "h-full", "flex", "justify-center", "items-center", "text-gray-400"])}>
                      <FontAwesomeIcon icon={faUser} />
                    </div>
                    <input type="text" placeholder={t("Fullname")} className={clsx(["w-full", "border", "border-gray-300", "rounded-md", "px-8", "py-3"])} {...field} />
                  </div>
                  {errors.fullname && <div className={clsx(["text-red-400", "mt-2", "pl-6", "pr-6", "text-sm"])}>{errors.fullname.message}</div>}
                </div>
              );
            }}
          />
          <Controller
            name="mobile"
            defaultValue=""
            control={control}
            render={({ field }) => {
              return (
                <div>
                  <div className={clsx(["relative", "mt-4"])}>
                    <div className={clsx(["absolute", "top-0", "left-2", "h-full", "flex", "justify-center", "items-center", "text-gray-400"])}>
                      <FontAwesomeIcon icon={faMobile} />
                    </div>
                    <input type="text" placeholder={t("Mobile")} className={clsx(["w-full", "border", "border-gray-300", "rounded-md", "px-8", "py-3"])} {...field} />
                  </div>
                  {errors.mobile && <div className={clsx(["text-red-400", "mt-2", "pl-6", "pr-6", "text-sm"])}>{errors.mobile.message}</div>}
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
                  <div className={clsx(["relative", "mt-4"])}>
                    <div className={clsx(["absolute", "top-0", "left-2", "h-full", "flex", "justify-center", "items-center", "text-gray-400"])}>
                      <FontAwesomeIcon icon={faMailBulk} />
                    </div>
                    <input type="text" placeholder={t("Email")} className={clsx(["w-full", "border", "border-gray-300", "rounded-md", "px-8", "py-3"])} {...field} />
                  </div>
                  {errors.email && <div className={clsx(["text-red-400", "mt-2", "pl-6", "pr-6", "text-sm"])}>{errors.email.message}</div>}
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
                  <div className={clsx(["relative", "mt-4"])}>
                    <div className={clsx(["absolute", "top-0", "left-2", "h-full", "flex", "justify-center", "items-center", "text-gray-400"])}>
                      <FontAwesomeIcon icon={faKey} />
                    </div>
                    <input type="password" placeholder={t("Password")} className={clsx(["w-full", "border", "border-gray-300", "rounded-md", "px-8", "py-3"])} {...field} />
                    <div className={clsx(["absolute", "top-0", "right-2", "h-full", "flex", "justify-center", "items-center", "text-gray-400"])}>
                      <FontAwesomeIcon icon={faEye} />
                    </div>
                  </div>
                  {errors.password && <div className={clsx(["text-red-400", "mt-2", "pl-6", "pr-6", "text-sm"])}>{errors.password.message}</div>}
                </div>
              );
            }}
          />
          <Controller
            name="passwordConfirmed"
            defaultValue=""
            control={control}
            render={({ field }) => {
              return (
                <div>
                  <div className={clsx(["relative", "mt-4"])}>
                    <div className={clsx(["absolute", "top-0", "left-2", "h-full", "flex", "justify-center", "items-center", "text-gray-400"])}>
                      <FontAwesomeIcon icon={faKey} />
                    </div>
                    <input type="password" placeholder={t("Confirm password")} className={clsx(["w-full", "border", "border-gray-300", "rounded-md", "px-8", "py-3"])} {...field} />
                    <div className={clsx(["absolute", "top-0", "right-2", "h-full", "flex", "justify-center", "items-center", "text-gray-400"])}>
                      <FontAwesomeIcon icon={faEye} />
                    </div>
                  </div>
                  {errors.passwordConfirmed && <div className={clsx(["text-red-400", "mt-2", "pl-6", "pr-6", "text-sm"])}>{errors.passwordConfirmed.message}</div>}
                </div>
              );
            }}
          />
          <button type="submit" className={clsx(["cursor-pointer", "bg-orange-600", "text-white", "mt-4", "w-full", "py-3", "rounded-md"])}>
            Đăng ký
          </button>
        </form>
      </div>
    </div>
  );
};

export { Register };
