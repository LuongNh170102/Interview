import { defineRouting } from "next-intl/routing";

const routing = defineRouting({
  locales: ["en", "vi"],
  defaultLocale: "vi",
  localePrefix: "as-needed"
});
export { routing };
