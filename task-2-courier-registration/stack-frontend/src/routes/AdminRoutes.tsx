import { Loadable } from "@/components";
import { AuthGuard } from "@/guards";
import { AdminLayout } from "@/layout";
import { delayTimeout } from "@/utils";
import React from "react";
const CourierList = Loadable(React.lazy(() => delayTimeout(import("@/pages/admin/courier/CourierList"))));
const CourierForm = Loadable(React.lazy(() => delayTimeout(import("@/pages/admin/courier/CourierForm"))));
const AdminRoutes = {
  path: "admin",
  element: (
    <AuthGuard>
      <AdminLayout />
    </AuthGuard>
  ),
  children: [
    {
      path: "courier",
      children: [
        {
          path: "list",
          element: <CourierList />
        },
        {
          path: "add",
          element: <CourierForm />
        },
        {
          path: "edit/:courier_id",
          element: <CourierForm />
        }
      ]
    }
  ]
};
export { AdminRoutes };
