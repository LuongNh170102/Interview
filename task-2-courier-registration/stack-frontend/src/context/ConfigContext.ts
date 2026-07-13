import React from "react";
import { type IConfigContext } from "@/types";
const ConfigContext = React.createContext<IConfigContext>({
  locale: "en",
  onChangeLocale: () => {}
});
export { ConfigContext };
