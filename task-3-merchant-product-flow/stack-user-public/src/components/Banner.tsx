import React from "react";
import Image from "next/image";
import clsx from "clsx";
import { produce } from "immer";
import stylesBanner from "@/scss/banner.module.scss";
type IBanner = {
  img: string;
  active: boolean;
};
const Banner = () => {
  const [directionSlider, setDirectionSlider] = React.useState<string>("next");
  const [banners, setBanners] = React.useState<IBanner[]>([
    { img: "banner-1.jpg", active: true },
    { img: "banner-2.png", active: false }
  ]);
  const handleSliderChange = (direction: string) => () => {
    const nextState: IBanner[] = produce(banners, (draft) => {
      for (var i = 0; i < draft.length; i++) {
        if (draft[i].active === true) {
          draft[i].active = false;
          if (direction === "next") {
            if (i + 1 < draft.length) {
              draft[i + 1].active = true;
              break;
            } else {
              draft[0].active = true;
              break;
            }
          } else {
            if (i - 1 >= 0) {
              draft[i - 1].active = true;
              break;
            } else {
              draft[draft.length - 1].active = true;
              break;
            }
          }
        }
      }
    });
    setBanners(nextState);
    setDirectionSlider(direction);
  };
  return (
    <React.Fragment>
      {banners && (
        <div className={clsx(["h-180", "max-lg:h-90", "max-md:h-50", "relative", stylesBanner.sliders])}>
          <div className={clsx(["relative", "w-full", "h-full", "z-1", stylesBanner.banners])}>
            {banners.map((item: IBanner, idx: number) => {
              return (
                <div key={`banner-slide-${idx}`} style={{ zIndex: item.active ? 99 : idx }} className={clsx(["absolute", "w-full", "h-full", "top-0", "left-0", stylesBanner.slide, item.active === true ? "opacity-100" : "opacity-0", item.active && directionSlider === "prev" && stylesBanner.activeSliderPrev, item.active && directionSlider === "next" && stylesBanner.activeSliderNext])}>
                  <Image alt="Website" width={1700} height={400} src={`/${item.img}`} className={clsx(["w-full", "h-full", "ml-auto", "mr-auto"])} />
                  <div className={clsx(["absolute", "top-0", "left-0", "w-full", "h-full", "shadow-md", item.active && stylesBanner.mask])}></div>
                </div>
              );
            })}
          </div>
          <div className={clsx(["absolute", "top-0", "left-0", "w-20", "h-full", "flex", "justify-center", "items-center", "z-2"])}>
            <button className={clsx(["w-10", "h-10", "flex", "justify-center", "items-center", "rounded-3xl", "border-2", "border-white", "cursor-pointer", "text-white", "font-bold"])} onClick={handleSliderChange("prev")}></button>
          </div>
          <div className={clsx(["absolute", "top-0", "right-0", "w-20", "h-full", "flex", "justify-center", "items-center", "z-3"])}>
            <button className={clsx(["w-10", "h-10", "flex", "justify-center", "items-center", "rounded-3xl", "border-2", "border-white", "cursor-pointer", "text-white", "font-bold"])} onClick={handleSliderChange("next")}></button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export { Banner };
