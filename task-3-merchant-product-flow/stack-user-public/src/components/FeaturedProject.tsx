import { faAngleLeft, faAngleRight, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import Image from "next/image";
import React from "react";
const FeaturedProject = () => {
  return (
    <React.Fragment>
      <div className={clsx(["flex", "items-center", "gap-x-2", "border-b", "border-red-600"])}>
        <div className={clsx(["text-white", "bg-red-600", "px-2", "py-2"])}>
          <FontAwesomeIcon icon={faStar} />
        </div>
        <h2 className={clsx(["uppercase", "text-md", "font-bold"])}>Dự án bất động sản nổi bật</h2>
      </div>
      <div className={clsx(["bg-green-100", "py-4", "relative"])}>
        <div className={clsx(["absolute", "px-5", "top-0", "left-0", "h-full", "flex", "items-center"])}>
          <div className={clsx(["w-8", "h-8", "flex", "justify-center", "items-center", "border", "border-amber-600", "text-red-600"])}>
            <FontAwesomeIcon icon={faAngleLeft} />
          </div>
        </div>
        <div className={clsx(["overflow-x-hidden", "w-160", "max-sm:w-100", "mx-auto"])}>
          <div className={clsx(["flex", "gap-x-4", "w-7xl", "relative", "top-0", "left-0"])}>
            {Array.from(Array(6), () => Math.floor(Math.random() * 100) + 1).map((elmt: number, idx: number) => {
              return (
                <div key={`idx-${idx}`} className={clsx(["bg-white"])}>
                  <Image src={"/thumb.png"} width={600} height={400} alt="Thẻ" className={clsx(["w-full"])} />
                  <div className={clsx(["py-2", "px-4"])}>
                    <div className={clsx(["bg-green-300", "px-2", "py-1", "text-green-600", "rounded-sm"])}>Đang mở bán</div>
                    <h3 className={clsx(["mt-2", "font-bold"])}>The Royal - Five Star Eco City</h3>
                    <div className={clsx(["mt-2"])}>51 triệu/m2 - 5.951,4 m2</div>
                    <div className={clsx(["mt-2"])}>Quận 7, Tp. Hồ Chí Minh</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className={clsx(["absolute", "px-5", "top-0", "right-0", "h-full", "flex", "items-center"])}>
          <div className={clsx(["w-8", "h-8", "flex", "justify-center", "items-center", "border", "border-amber-600", "text-red-600"])}>
            <FontAwesomeIcon icon={faAngleRight} />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export { FeaturedProject };
