import { Input } from "antd";
import React from "react";
import Swal from "sweetalert2";
const { TextArea } = Input;
type IForm = {
  comment?: string;
};
const Toast = Swal.mixin({
  toast: true,
  position: "bottom-start",
  showConfirmButton: false,
  timer: 8000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});
interface IUser {
  id: number;
  username: string;
  email: string;
  fullname: string;
}
interface IMenu {
  id: number;
  display_message: string;
  user_id: number;
  user: IUser;
  comment_parent_id: number | null;
  created_at: string;
  enabledReply: boolean;
}
interface MenuProps {
  id: number | null;
  level: number;
}
const DashboardPage: React.FC = () => {
  return <React.Fragment>DashboardPage</React.Fragment>;
};

export default DashboardPage;
