import { Loadable } from "@/components";
import { AuthGuard } from "@/guards";
import { AdminLayout } from "@/layout";
import { delayTimeout } from "@/utils";
import React from "react";
const ProductList = Loadable(React.lazy(() => delayTimeout(import("@/pages/admin/product/ProductList"))));
const ProductFrm = Loadable(React.lazy(() => delayTimeout(import("@/pages/admin/product/ProductFrm"))));
const AdminRoutes = {
  path: "admin",
  element: (
    <AuthGuard>
      <AdminLayout />
    </AuthGuard>
  ),
  children: [
    {
      path: "product",
      children: [
        {
          path: "list",
          element: <ProductList />
        },
        {
          path: "add",
          element: <ProductFrm />
        },
        {
          path: "edit/:productId",
          element: <ProductFrm />
        }
      ]
    }
  ]
};
export { AdminRoutes };
