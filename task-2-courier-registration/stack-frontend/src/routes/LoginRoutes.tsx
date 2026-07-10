import { Loadable } from "@/components";
import { GuestGuard } from "@/guards";
import { delayTimeout } from "@/utils";
import React from "react";
const LoginPage = Loadable(React.lazy(() => delayTimeout(import("@/pages/admin/LoginPage"))));
const LoginRoutes = {
  path: "/",
  element: (
    <GuestGuard>
      <LoginPage />
    </GuestGuard>
  )
};
export { LoginRoutes };
