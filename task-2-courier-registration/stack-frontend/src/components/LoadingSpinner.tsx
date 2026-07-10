import { Spin } from "antd";
import React from "react";
import { useAppSelector } from "@/hooks";
import clsx from "clsx";
const LoadingSpinner = () => {
  const { isShow } = useAppSelector((state) => state.loading);
  return (
    <React.Fragment>
      {isShow && (
        <div className={clsx(["fixed", "w-screen", "h-screen", "top-0", "left-0"])}>
          <div className={clsx(["absolute", "w-full", "h-full", "top-0", "left-0", "bg-black", "opacity-35"])}></div>
          <div className={clsx(["absolute", "w-full", "h-full", "top-0", "left-0", "flex", "justify-center", "items-center"])}>
            <Spin size="large" />
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export { LoadingSpinner };
