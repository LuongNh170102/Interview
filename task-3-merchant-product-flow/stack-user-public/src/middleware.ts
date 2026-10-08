import createMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";
import { NextRequest } from "next/server";
export default function middleware(request: NextRequest) {
  const defaultLocale = request.headers.get("x-your-custom-locale") || "en";
  const handleI18nRouting = createMiddleware(
    defineRouting({
      locales: ["en", "vi"],
      defaultLocale: "en",
      localePrefix: "as-needed"
    })
  );
  const response = handleI18nRouting(request);
  response.headers.set("x-your-custom-locale", defaultLocale);
  return response;
}
export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)"
};
