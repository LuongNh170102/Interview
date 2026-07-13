import { useRoutes } from "react-router-dom";
import { AdminRoutes } from "./AdminRoutes";
import { LoginRoutes } from "./LoginRoutes";
export default function ThemeRoutes() {
  return useRoutes([LoginRoutes, AdminRoutes]);
}
