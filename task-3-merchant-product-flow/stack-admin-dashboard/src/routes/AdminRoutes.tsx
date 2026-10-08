import { Loadable } from "@/components";
import { AuthGuard } from "@/guards";
import { AdminLayout } from "@/layout";
import { delayTimeout } from "@/utils";
import { lazy } from "react";
const ProductList = Loadable(lazy(() => delayTimeout(import("@/pages/admin/product/ProductList"))));
const ProductFrm = Loadable(lazy(() => delayTimeout(import("@/pages/admin/product/ProductFrm"))));
const OrdersList = Loadable(lazy(() => delayTimeout(import("@/pages/admin/orders/OrdersList"))));
const OrdersFrm = Loadable(lazy(() => delayTimeout(import("@/pages/admin/orders/OrdersFrm"))));
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
    },
    {
      path: "orders",
      children: [
        {
          path: "list",
          element: <OrdersList />
        },
        {
          path: "form/:action/:orderId",
          element: <OrdersFrm />
        }
      ]
    }
  ]
};
export { AdminRoutes };
