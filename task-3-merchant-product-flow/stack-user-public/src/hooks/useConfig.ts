import React from "react";
import { ConfigContext } from "@/context";

const useConfig = () => {
  const context = React.useContext(ConfigContext);
  return context;
};

export { useConfig };
