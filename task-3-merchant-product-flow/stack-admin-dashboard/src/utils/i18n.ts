import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enLocales from "@/locales/en.json";
import viLocales from "@/locales/vi.json";
const resources = {
  en: { translation: enLocales },
  vi: { translation: viLocales }
};
i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  interpolation: {
    escapeValue: false
  }
});

export { i18n };
