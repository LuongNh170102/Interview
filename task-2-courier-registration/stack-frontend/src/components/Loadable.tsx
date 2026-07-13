import { Skeleton } from "antd";
import React, { type ComponentType, type LazyExoticComponent, type ReactElement, Suspense } from "react";
// material-ui

// project imports

// ==============================|| LOADABLE - LAZY LOADING ||============================== //

const Loadable = (Component: LazyExoticComponent<() => ReactElement> | ComponentType<React.ReactNode>) => (props: any) =>
  (
    <Suspense fallback={<Skeleton />}>
      <Component {...props} />
    </Suspense>
  );

export { Loadable };
