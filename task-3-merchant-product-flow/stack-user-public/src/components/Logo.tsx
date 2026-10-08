import React from "react";
import clsx from "clsx";
const Logo = () => {
  return (
    <div className={clsx(["font-(family-name:--font-jost)"])}>
      <span className={clsx(["text-red-600"])}>M</span>
      <span className={clsx(["text-red-600"])}>A</span>
      <span className={clsx(["text-red-600"])}>C</span>
      <span className={clsx(["text-red-600"])}>O</span>
      <span className={clsx(["text-red-600"])}>N</span>
      <span className={clsx(["text-red-600"])}>E</span>
    </div>
  );
};

export { Logo };
