"use client";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import Image from "next/image";
import React from "react";
import stylesProjects from "@/scss/projects.module.scss";
const Faq = () => {
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
    <div>
      <div className={clsx(["flex", "max-sm:block", "gap-x-4", "mt-1"])} ref={projectsRef}>
        <div className={clsx(["w-[50%]", "max-sm:w-full"])}>
          <div className={clsx(["flex", "items-center", "gap-x-2", "border-b", "border-red-600", "mt-5"])}>
            <div className={clsx(["text-white", "bg-red-600", "px-2", "py-2"])}>
              <FontAwesomeIcon icon={faBars} />
            </div>
            <h2 className={clsx(["uppercase", "text-md", "font-bold"])}>Tư vấn luật</h2>
          </div>
          <div className={clsx(["border", "border-gray-200", "px-1", "py-1"])}>
            <Image src="/bdskcn-d0b7-445x291.jpg" alt="Web" width={600} height={400} />
            <h3 className={clsx(["text-red-600", "font-bold", "mt-2", "border-b", "border-gray-200"])}>Phân khúc KCN: Giá thuê tại Hà Nội, Tp.HCM cao gấp đôi các tỉnh lân cận</h3>
            <div className={clsx(["mt-2"])}>
              {Array.from(Array(3), () => Math.floor(Math.random() * 100) + 1).map((elmt: number, idx: number) => {
                return (
                  <div key={`idx-${idx}`} className={clsx(["flex", "border-b", "border-gray-200", "mb-5", "gap-x-2", "pb-2"])}>
                    <div className={clsx(["bg-red-600", "w-2", "h-1.5", "mt-2"])}></div>
                    <div>Quy hoạch ga Hà Nội thành điển hình của mô hình phát triển đô thị</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className={clsx(["w-[50%]", "max-sm:w-full"])}>
          <div className={clsx(["flex", "items-center", "gap-x-2", "border-b", "border-red-600", "mt-5"])}>
            <div className={clsx(["text-white", "bg-red-600", "px-2", "py-2"])}>
              <FontAwesomeIcon icon={faBars} />
            </div>
            <h2 className={clsx(["uppercase", "text-md", "font-bold"])}>Thiết kế kiến trúc</h2>
          </div>
          <div className={clsx(["border", "border-gray-200", "px-1", "py-1"])}>
            <Image src="/bdskcn-d0b7-445x291.jpg" alt="Web" width={600} height={400} />
            <h3 className={clsx(["text-red-600", "font-bold", "mt-2", "border-b", "border-gray-200"])}>Phân khúc KCN: Giá thuê tại Hà Nội, Tp.HCM cao gấp đôi các tỉnh lân cận</h3>
            <div className={clsx(["mt-2"])}>
              {Array.from(Array(3), () => Math.floor(Math.random() * 100) + 1).map((elmt: number, idx: number) => {
                return (
                  <div key={`idx-${idx}`} className={clsx(["flex", "border-b", "border-gray-200", "mb-5", "gap-x-2", "pb-2"])}>
                    <div className={clsx(["bg-red-600", "w-2", "h-1.5", "mt-2"])}></div>
                    <div>Quy hoạch ga Hà Nội thành điển hình của mô hình phát triển đô thị</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Faq };
