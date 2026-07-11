import stylesContainer from "@/assets/scss/container.module.scss";
import styles from "@/assets/scss/layout.module.scss";
import { useAppDispatch, useAuth } from "@/hooks";
import { logoutAction } from "@/slices";
import { AxiosService, getExpired } from "@/utils";
import { LogoutOutlined } from "@ant-design/icons";
import clsx from "clsx";
import React from "react";
import { Link, Outlet } from "react-router-dom";
const AdminLayout = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const handleLogout = () => {
    setTimeout(() => {
      AxiosService()
        .post("/auth/logout", { headers: { isShowLoading: false } })
        .then((res) => {
          const { statusCode } = res.data;
          if (parseInt(statusCode) >= 200 && parseInt(statusCode) <= 299) {
            document.cookie = `${import.meta.env.VITE_ACCESS_TOKEN_PREFIX}=token; expires=${getExpired(-100)}; path=/;`;
            dispatch(logoutAction());
          }
        });
    }, 1000);
  };
  return (
    <React.Fragment>
      <div className={clsx([stylesContainer.container, "ml-auto", "mr-auto", "h-screen", "flex"])}>
        <div className={clsx(["bg-sky-800", "w-80", "pt-5", "pb-5", "pl-5", "pr-5"])}>
          <h1 className={clsx(["text-white", "text-center", "font-bold", "text-3xl", "mb-5", styles.logoText])}>{import.meta.env.VITE_ENV}</h1>
          <ul className={clsx(["text-white", "text-md", styles.menuList])}>
            <li className={clsx(["rounded-3xl", "hover:bg-sky-900"])}>
              <Link to={"/admin/prduct/list"} className={clsx(["block"])}>
                Product
              </Link>
            </li>
          </ul>
        </div>
        <div className={clsx(["grow"])}>
          <div className={clsx(["bg-sky-800", "pt-5", "pb-5", "pl-5", "pr-5", "flex", "justify-end", "text-white", "gap-x-8", "items-center"])}>
            <div>{user && user.username ? user.username : ""}</div>
            <div>{user && user.fullname ? user.fullname : ""}</div>
            <button onClick={handleLogout} className={clsx(["cursor-pointer", "text-2xl"])}>
              <LogoutOutlined />
            </button>
          </div>
          <div className={clsx(["pt-2", "pb-2", "pl-2", "pr-2"])}>
            <Outlet />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export { AdminLayout };
