import "@/assets/scss/app.css";
import { useAppDispatch, useAuth } from "@/hooks";
import { logoutAction } from "@/slices";
import { AxiosService, getExpired } from "@/utils";
import { LogoutOutlined } from "@ant-design/icons";
import { Col, Row } from "antd";
import clsx from "clsx";
import { Fragment, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import type { MenuProps } from "antd";
import { Button, Menu } from "antd";
import { AppstoreOutlined, ContainerOutlined, DesktopOutlined, MailOutlined, MenuFoldOutlined, MenuUnfoldOutlined, PieChartOutlined } from "@ant-design/icons";
import stylesLayout from "@/assets/scss/layout.module.scss";
type MenuItem = Required<MenuProps>["items"][number];
const items: MenuItem[] = [
  { key: "product", icon: <PieChartOutlined />, label: "Product" },
  { key: "orders", icon: <DesktopOutlined />, label: "Orders" }
];
const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const handleLogout = () => {
    setTimeout(() => {
      AxiosService()
        .post("/auth/logout", { headers: { isShowLoading: false } })
        .then((res) => {
          const { statusCode } = res.data;
          if (parseInt(statusCode) >= 200 && parseInt(statusCode) <= 299) {
            localStorage.removeItem(import.meta.env.VITE_ACCESS_TOKEN_PREFIX);
            localStorage.removeItem(import.meta.env.VITE_REFRESH_TOKEN_PREFIX);
            dispatch(logoutAction());
          }
        });
    }, 1000);
  };
  const onClick: MenuProps["onClick"] = (e) => {
    const { key } = e;
    switch (key) {
      case "product":
        navigate("/admin/product/list");
        break;
      case "orders":
        navigate("/admin/orders/list");
        break;
    }
  };
  return (
    <Fragment>
      <Row>
        <Col span={4} className={clsx(["bg-sky-800", "h-screen"])}>
          <h1 className={clsx(["flex", "justify-center", "items-center", "text-white", "text-4xl", "py-5", stylesLayout.logoText])}>{import.meta.env.VITE_ENV}</h1>
          <div>
            <Menu onClick={onClick} defaultSelectedKeys={["1"]} defaultOpenKeys={["sub1"]} mode="inline" theme="dark" inlineCollapsed={collapsed} items={items} />
          </div>
        </Col>
        <Col span={20}>
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
        </Col>
      </Row>
    </Fragment>
  );
};

export { AdminLayout };
