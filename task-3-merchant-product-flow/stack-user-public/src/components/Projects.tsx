"use client";
import { faBars, faBeer, faCableCar, faStar, faStreetView } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import Image from "next/image";
import React from "react";
import stylesProjects from "@/scss/projects.module.scss";
const Projects = () => {
  const projectsRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const onScroll = () => {
      let offsetView = window.scrollY + window.innerHeight;
      if (projectsRef && projectsRef.current) {
        let childNodes = projectsRef.current.children;
        if (childNodes) {
          for (let i = 0; i < childNodes.length; i++) {
            let elmt = childNodes.item(i) as HTMLElement | null;
            if (elmt) {
              let elmtOffsetTop = elmt.offsetTop;
              if (offsetView >= elmtOffsetTop) {
                elmt.classList.add(stylesProjects.projectsForYouOnScroll);
              }
            }
          }
        }
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return (
    <React.Fragment>
      <div className={clsx(["flex", "items-center", "gap-x-2", "border-b", "border-red-600"])}>
        <div className={clsx(["text-white", "bg-red-600", "px-2", "py-2"])}>
          <FontAwesomeIcon icon={faStar} />
        </div>
        <h2 className={clsx(["uppercase", "text-md", "font-bold"])}>Dự án</h2>
      </div>
      <div className={clsx(["grid", "grid-cols-3", "max-sm:grid-cols-1  ", "gap-x-5"])} ref={projectsRef}>
        {Array.from(Array(10), () => Math.floor(Math.random() * 100) + 1).map((elmt: number, idx: number) => {
          return (
            <div key={`idx-${idx}`} className={clsx(["mt-5", "border-gray-200", "gap-x-4"])}>
              <div className={clsx(["relative"])}>
                <Image src={"/thumb.png"} width={600} height={400} alt="Thẻ" className={clsx(["w-full"])} />
                <div className={clsx(["absolute", "bottom-0", "left-0", "bg-red-600", "w-full", "text-center", "py-3", "uppercase", "text-white"])}>Tổ hợp đa năng 7 Trần Phú</div>
              </div>
              <div className={clsx(["px-1", "py-3"])}>
                <div className={clsx(["flex", "gap-x-4", "flex-wrap", "gap-y-2"])}>
                  <div className={clsx(["flex", "gap-x-1", "items-center"])}>
                    <div>
                      <FontAwesomeIcon icon={faStreetView} />
                    </div>
                    <div className={clsx(["text-xs"])}>11m</div>
                  </div>
                  <div className={clsx(["flex", "gap-x-1", "items-center"])}>
                    <div>
                      <FontAwesomeIcon icon={faBars} />
                    </div>
                    <div className={clsx(["text-xs"])}>3 tầng</div>
                  </div>
                  <div className={clsx(["flex", "gap-x-1", "items-center"])}>
                    <div>
                      <FontAwesomeIcon icon={faBeer} />
                    </div>
                    <div className={clsx(["text-xs"])}>4 phòng ngủ</div>
                  </div>
                  <div className={clsx(["flex", "gap-x-1", "items-center"])}>
                    <div>
                      <FontAwesomeIcon icon={faCableCar} />
                    </div>
                    <div className={clsx(["text-xs"])}>Chỗ đặt xe</div>
                  </div>
                </div>
                <div className={clsx(["flex", "gap-x-2", "text-xs", "mt-4"])}>
                  <div className={clsx(["flex", "gap-x-1"])}>
                    <div className={clsx(["font-bold"])}>Giá:</div>
                    <div>16,2 tỷ</div>
                  </div>
                  <div className={clsx(["flex", "gap-x-1"])}>
                    <div className={clsx(["font-bold"])}>Diện tích:</div>
                    <div>100m2</div>
                  </div>
                  <div className={clsx(["flex", "gap-x-1"])}>
                    <div className={clsx(["font-bold"])}>KT:</div>
                    <div>5x20m</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </React.Fragment>
  );
};

export { Projects };
