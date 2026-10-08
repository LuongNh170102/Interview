import { Logo } from "@/components";
import { Link } from "@/utils";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faEye, faKey, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import Image from "next/image";
import Swal from "sweetalert2";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { AxiosService } from "@/utils";
import { useTranslations } from "next-intl";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Fragment } from "react";
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
const Login = () => {
  const t = useTranslations("page_translate");
  const schema = yup
    .object({
      username: yup.string().required(t("field_required")),
      password: yup.string().required(t("field_required"))
    })
    .required();
  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm<IFormInput>({
    defaultValues: {
      username: "",
      password: ""
    },
    resolver: yupResolver(schema)
  });
  const onSubmit: SubmitHandler<IFormInput> = (dataFrm) => {
    const { username, password } = dataFrm;
    AxiosService()
      .post("/customer/login", { username, password }, { headers: { isShowLoading: true } })
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
        <h3 className={clsx(["text-lg"])}>Xin chào bạn</h3>
        <h4 className={clsx(["text-2xl", "mt-3"])}>Đăng nhập để tiếp tục</h4>
        <form className={clsx(["mt-6"])} onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="username"
            defaultValue=""
            control={control}
            render={({ field }) => {
              return (
                <div>
                  <div className={clsx(["relative"])}>
                    <div className={clsx(["absolute", "top-0", "left-2", "h-full", "flex", "justify-center", "items-center", "text-gray-400"])}>
                      <FontAwesomeIcon icon={faUser} />
                    </div>
                    <input type="text" placeholder="Số điện thoại hoặc email" className={clsx(["w-full", "border", "border-gray-300", "rounded-md", "px-8", "py-3"])} />
                  </div>
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
                  <div className={clsx(["relative", "mt-4"])}>
                    <div className={clsx(["absolute", "top-0", "left-2", "h-full", "flex", "justify-center", "items-center", "text-gray-400"])}>
                      <FontAwesomeIcon icon={faKey} />
                    </div>
                    <input type="password" placeholder="Mật khẩu" className={clsx(["w-full", "border", "border-gray-300", "rounded-md", "px-8", "py-3"])} />
                    <div className={clsx(["absolute", "top-0", "right-2", "h-full", "flex", "justify-center", "items-center", "text-gray-400"])}>
                      <FontAwesomeIcon icon={faEye} />
                    </div>
                  </div>
                  {errors.password && <div className={clsx(["text-red-400", "mt-2", "pl-6", "pr-6", "text-sm"])}>{errors.password.message}</div>}
                </div>
              );
            }}
          />
          <button type="submit" className={clsx(["cursor-pointer", "bg-orange-600", "text-white", "mt-4", "w-full", "py-3", "rounded-md"])}>
            Đăng nhập
          </button>
          <div className={clsx(["flex", "justify-between", "mt-4"])}>
            <div className={clsx(["flex", "gap-x-2", "items-center"])}>
              <input type="checkbox" />
              <div>Nhớ tài khoản</div>
            </div>
            <div className={clsx(["text-orange-600"])}>
              <Link href={{ pathname: "/" }}>Quên mật khẩu?</Link>
            </div>
          </div>
          <div className={clsx(["flex", "gap-x-2", "items-center", "justify-center", "mt-6"])}>
            <hr className={clsx(["border-t", "border-gray-200", "w-[30%]"])} />
            <div>Hoặc</div>
            <hr className={clsx(["border-t", "border-gray-200", "w-[30%]"])} />
          </div>
          <button type="button" className={clsx(["relative", "border", "border-gray-300", "rounded-md", "w-full", "py-2", "mt-6"])}>
            <div className={clsx(["absolute", "top-0", "left-2", "h-full", "flex", "items-center", "justify-center"])}>
              <FontAwesomeIcon icon={faGoogle} />
            </div>
            <span>Đăng nhập với Google</span>
          </button>
          <div className={clsx(["text-center", "mt-4", "text-gray-500", "text-xs", "mt-6"])}>
            Bằng việc tiếp tục, bạn đồng ý với{" "}
            <Link className={clsx(["text-orange-600"])} href={{ pathname: "/" }}>
              Điều khoản sử dụng
            </Link>
            ,
            <Link className={clsx(["text-orange-600"])} href={{ pathname: "/" }}>
              Chính sách bảo mật
            </Link>
          </div>
          <div className={clsx(["text-center", "text-gray-500", "text-xs"])}>
            <Link className={clsx(["text-orange-600"])} href={{ pathname: "/" }}>
              Quy chế
            </Link>
            ,
            <Link className={clsx(["text-orange-600"])} href={{ pathname: "/" }}>
              Chính sách của chúng tôi
            </Link>
            .
          </div>
          <div className={clsx(["mt-20", "text-center"])}>
            Chưa là thành viên,&nbsp;
            <Link href={{ pathname: "/" }} className={clsx(["text-orange-600"])}>
              Đăng ký
            </Link>
            &nbsp; tại đây
          </div>
        </form>
      </div>
    </div>
  );
};

export { Login };
