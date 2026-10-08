import clsx from "clsx";
import React from "react";
type IButton = {
  lblCtrl: string;
  iconCtrl: React.ReactNode;
  onClickForm: () => void;
};
const AppButton: React.FC<IButton> = ({ lblCtrl, iconCtrl, onClickForm }) => {
  const handleClickForm = () => {
    onClickForm();
  };
  return (
    <button
      type="button"
      onClick={handleClickForm}
      className={clsx(["bg-sky-500", "border", "border-sky-500", "rounded-sm", "pl-14", "pr-6", "pt-0", "pb-0", "cursor-pointer", "relative", "text-right"])}
    >
      <span className={clsx(["bg-sky-600", "absolute", "top-0", "left-0", "h-full", "flex", "items-center", "justify-center", "pl-2", "pr-2", "text-white", "text-sm"])}>{iconCtrl}</span>
      <span className={clsx(["absolute", "bottom-0", "left-0", "bg-sky-500", "opacity-5", "h-1", "w-full", "rounded-bl-sm", "rounded-br-sm"])}></span>
      <span className={clsx(["text-white", "uppercase"])}>{lblCtrl}</span>
    </button>
  );
};

export { AppButton };
