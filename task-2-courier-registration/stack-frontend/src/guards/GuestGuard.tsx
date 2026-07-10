import { useAuth } from "@/hooks";
import React from "react";
import { useNavigate } from "react-router-dom";

// ==============================|| GUEST GUARD ||============================== //

/**
 * Guest guard for routes having no auth required
 * @param {PropTypes.node} children children element/node
 */

const GuestGuard: React.FC<React.PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  React.useEffect(() => {
    if (isLoggedIn) {
      navigate("/admin/courier/list");
    }
  }, [isLoggedIn]);
  return children;
};

export { GuestGuard };
