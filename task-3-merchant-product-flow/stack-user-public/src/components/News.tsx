import { BannerSearch, FeaturedProject, ProjectsForYou, Projects } from "@/components";
import stylesHomePage from "@/scss/home.module.scss";
import { Link } from "@/utils";
import { faBars, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import Image from "next/image";
import React from "react";
const News = () => {
  return (
    <React.Fragment>
      <div className={clsx(["mt-5", "flex", "max-sm:block", "gap-x-5"])}>
        <div className={clsx(["w-[50%]", "max-sm:w-full", "border", "border-gray-200", "px-2", "py-2"])}>
          <Image alt="Web" src="/news.jpg" width={600} height={400} />
          <h3 className={clsx(["mt-2", "text-red-600"])}>Phân khúc KCN: Giá thuê tại Hà Nội, Tp.HCM cao gấp đôi các tỉnh lân cận</h3>
        </div>
        <div className={clsx(["grow", "max-sm:mt-2", "border", "border-gray-200", "px-2", "py-2"])}>
          {Array.from(Array(3), () => Math.floor(Math.random() * 100) + 1).map((elmt: number, idx: number) => {
            return (
              <div key={`idx-${idx}`} className={clsx(["flex", "border-b", "border-gray-200", "mb-5", "gap-x-2", "pb-2"])}>
                <Image alt="Web" src="/thumb.png" width={600} height={400} className={clsx(["w-30"])} />
                <div className={clsx(["flex", "gap-x-2"])}>
                  <div className={clsx(["bg-red-600", "w-2", "h-1.5", "mt-2"])}></div>
                  <div>Quy hoạch ga Hà Nội thành điển hình của mô hình phát triển đô thị</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </React.Fragment>
  );
};

export { News };
