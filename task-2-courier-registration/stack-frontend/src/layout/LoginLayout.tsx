import { Outlet } from "react-router-dom";
import React from "react";
const LoginLayout = () => {
  return (
    <React.Fragment>
      <Outlet />
    </React.Fragment>
  );
};

export { LoginLayout };
