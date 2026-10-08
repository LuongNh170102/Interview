import { Loadable } from "@/components";
import { GuestGuard } from "@/guards";
import { delayTimeout } from "@/utils";
import { lazy } from "react";
const LoginPage = Loadable(lazy(() => delayTimeout(import("@/pages/admin/LoginPage"))));
const LoginRoutes = {
  path: "/",
  element: (
    <GuestGuard>
      <LoginPage />
    </GuestGuard>
  )
};
export { LoginRoutes };
