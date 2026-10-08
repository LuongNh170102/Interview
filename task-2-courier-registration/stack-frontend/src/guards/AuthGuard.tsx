import { useAuth } from "@/hooks";
import React from "react";
import { useNavigate } from "react-router-dom";

// ==============================|| AUTH GUARD ||============================== //

/**
 * Authentication guard for routes
 * @param {PropTypes.node} children children element/node
 */
const AuthGuard: React.FC<React.PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  React.useEffect(() => {
    if (!isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, user]);
  return children;
};

export { AuthGuard };
