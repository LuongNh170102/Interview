"use client";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import Image from "next/image";
import React from "react";
import stylesProjects from "@/scss/projects.module.scss";
const ProjectsForYou = () => {
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
      <div className={clsx(["flex", "items-center", "gap-x-2", "border-b", "border-red-600", "mt-5"])}>
        <div className={clsx(["text-white", "bg-red-600", "px-2", "py-2"])}>
          <FontAwesomeIcon icon={faBars} />
        </div>
        <h2 className={clsx(["uppercase", "text-md", "font-bold"])}>Bất động sản giành cho bạn</h2>
      </div>
      <div className={clsx(["mt-1"])} ref={projectsRef}>
        {Array.from(Array(10), () => Math.floor(Math.random() * 100) + 1).map((elmt: number, idx: number) => {
          return (
            <div key={`idx-${idx}`} className={clsx(["flex", "mt-3", "border", "border-gray-200", "gap-x-4"])}>
              <Image src={"/thumb.png"} width={600} height={400} alt="Thẻ" className={clsx(["w-50", "max-sm:h-full"])} />
              <div className={clsx(["grow", "px-1", "py-3"])}>
                <h3 className={clsx(["text-red-600", "font-bold"])}>Bán gấp căn nhà ngay chợ Bình Chánh</h3>
                <div className={clsx(["flex", "max-sm:block", "justify-start", "w-full", "mt-3"])}>
                  <div className={clsx(["w-[50%]", "max-sm:w-full"])}>
                    <div>Diện tích: 120m2</div>
                    <div className={clsx(["mt-1"])}>Vị trí: Quận 1, TP. Hồ Chí Minh</div>
                  </div>
                  <div className={clsx(["grow", "max-sm:mt-2"])}>
                    <div>Giá: 830 triệu</div>
                    <div className={clsx(["mt-1"])}>Ngày đăng: 26/06/2026</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className={clsx(["mt-3", "text-center"])}>
        <button className={clsx(["bg-red-600", "text-white", "px-3", "py-2"])}>Xem thêm tin bất động sản</button>
      </div>
    </React.Fragment>
  );
};

export { ProjectsForYou };
