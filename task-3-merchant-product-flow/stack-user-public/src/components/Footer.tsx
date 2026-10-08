import { Logo } from "@/components";
import stylesFooter from "@/scss/footer.module.scss";
import { Link } from "@/utils";
import clsx from "clsx";
import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFaceFrown, faSchool } from "@fortawesome/free-solid-svg-icons";
const Footer = () => {
  return (
    <React.Fragment>
      <div className={clsx(["bg-gray-900", "mt-10"])}>
        <div className={clsx([stylesFooter.footer, "text-white", "py-10", "max-lg:mt-0", "ml-auto", "mr-auto", "max-w-7xl", "px-4", "gap-x-4", "grid", "grid-cols-4", "max-lg:grid-cols-2"])}>
          <div className={clsx(["max-lg:mt-10"])}>
            <div className={clsx(["text-left"])}>
              <Link href={{ pathname: "/" }} className={clsx(["font-bold", "text-3xl", "font-(family-name:--font-jost)"])}>
                <Logo />
              </Link>
            </div>
            <div className={clsx(["mt-3"])}>Tìm Nhà Thấy Địa Chỉ Và Giá</div>
            <div className={clsx(["mt-3", "font-bold"])}>CÔNG TY TNHH ĐỊA ỐC MOSNO</div>
            <div className={clsx(["mt-3", "flex", "gap-x-2"])}>
              <div>29 Hoàng Việt, phường Tân Sơn Nhất, TP.HCM</div>
            </div>
            <div className={clsx(["mt-3", "flex", "gap-x-2"])}>
              <div>1900 252 307</div>
            </div>
          </div>
          <div className={clsx(["max-lg:mt-10"])}>
            <h3 className={clsx(["relative", stylesFooter.footerTitle, "text-lg", "font-bold"])}>Về MOSNO</h3>
            <ul className={clsx([stylesFooter.footerMenu])}>
              <li>
                <Link href={{ pathname: "/" }}>Giới thiệu</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Tuyển dụng</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Tin tức BĐS</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Tử vi phong thủy</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Quyền lợi người mua - thuê</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Quyền lợi môi giới</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Quyền lợi chủ nhà</Link>
              </li>
            </ul>
          </div>
          <div className={clsx(["max-lg:mt-10"])}>
            <h3 className={clsx(["relative", stylesFooter.footerTitle, "text-lg", "font-bold"])}>Cộng đồng</h3>
            <ul className={clsx([stylesFooter.footerMenu])}>
              <li>
                <Link href={{ pathname: "/" }}>Tiếp nhận phản ánh</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Danh sách phản ánh</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Cơ chế giải quyết tranh chấp</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Cộng đồng môi giới</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Quy chế hoạt động</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Chính sách bảo mật</Link>
              </li>
            </ul>
          </div>
          <div className={clsx(["max-lg:mt-10"])}>
            <h3 className={clsx(["relative", stylesFooter.footerTitle, "text-lg", "font-bold"])}>Hỗ trợ khách hàng</h3>
            <div className={clsx(["flex", "gap-x-1", "text-2xl", "text-white"])}>
              <div className={clsx(["w-9", "h-9", "border", "border-gray-50", "rounded-full", "text-md", "flex", "justify-center", "items-center"])}>
                <FontAwesomeIcon icon={faSchool} />
              </div>
              <div className={clsx(["w-9", "h-9", "border", "border-gray-50", "rounded-full", "text-md", "flex", "justify-center", "items-center"])}>
                <FontAwesomeIcon icon={faFaceFrown} />
              </div>
              <div className={clsx(["w-9", "h-9", "border", "border-gray-50", "rounded-full", "text-md", "flex", "justify-center", "items-center"])}>
                <FontAwesomeIcon icon={faFaceFrown} />
              </div>
              <div className={clsx(["w-9", "h-9", "border", "border-gray-50", "rounded-full", "text-md", "flex", "justify-center", "items-center"])}>
                <FontAwesomeIcon icon={faFaceFrown} />
              </div>
              <div className={clsx(["w-9", "h-9", "border", "border-gray-50", "rounded-full", "text-md", "flex", "justify-center", "items-center"])}>
                <FontAwesomeIcon icon={faFaceFrown} />
              </div>
              <div className={clsx(["w-9", "h-9", "border", "border-gray-50", "rounded-full", "text-md", "flex", "justify-center", "items-center"])}>
                <FontAwesomeIcon icon={faFaceFrown} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export { Footer };
