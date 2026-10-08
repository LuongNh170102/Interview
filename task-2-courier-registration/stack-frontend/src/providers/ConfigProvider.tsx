import { ConfigContext } from "@/context";
import React from "react";
type IConfig = {
  locale: string;
};
const ConfigProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [config, setConfig] = React.useState<IConfig>({ locale: "en" });
  const onChangeLocale = async (locale: string) => {
    localStorage.setItem(import.meta.env.VITE_APP_CONFIG ? import.meta.env.VITE_APP_CONFIG.toString() : "", JSON.stringify({ ...config, locale }));
    setConfig({ ...config, locale });
  };
  React.useEffect(() => {
    const init = async () => {
      const projectConfigJson: string | null = localStorage.getItem(import.meta.env.VITE_APP_CONFIG ? import.meta.env.VITE_APP_CONFIG.toString() : "");
      if (projectConfigJson) {
        const projectConfigObj: IConfig | null = JSON.parse(projectConfigJson);
        if (projectConfigObj && projectConfigObj.locale) {
          onChangeLocale(projectConfigObj.locale.toString());
        }
      } else {
        onChangeLocale(config.locale);
      }
    };
    init();
  }, []);
  return <ConfigContext.Provider value={{ ...config, onChangeLocale }}>{children}</ConfigContext.Provider>;
};

export { ConfigProvider };
