import React from "react";
import { Button, Card, Flex, Form, type FormProps, Input } from "antd";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useMutation } from "@apollo/client";
import { REGISTER } from "@/graphql-client";
type FieldType = {
  password: string;
  password_confirmed: string;
  email: string;
  fullname: string;
  phone: string;
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
interface IDuplicate {
  isDuplicateUsername: boolean;
  isDuplicateEmail: boolean;
}
const RegisterPage = () => {
  const [frmSignup] = Form.useForm();
  const navigate = useNavigate();
  const [register] = useMutation(REGISTER);
  const [isDuplicate, setIsDuplicate] = React.useState<IDuplicate>({
    isDuplicateUsername: false,
    isDuplicateEmail: false
  });
  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    const { password, password_confirmed, email, fullname, phone } = values;
    let checked: boolean = true;
    if (password.length >= 5 && password_confirmed.length >= 5) {
      if (password !== password_confirmed) {
        frmSignup.setFields([
          {
            name: "password_confirmed",
            errors: ["Password confirmed is not matched to password"]
          }
        ]);
        checked = false;
      }
    } else {
      if (password.length < 5) {
        frmSignup.setFields([{ name: "password", errors: ["Password length must be greater than 6 characters"] }]);
        checked = false;
      }
      if (password_confirmed.length < 6) {
        frmSignup.setFields([
          {
            name: "password",
            errors: ["Password confirmed length must be greater than 6 characters"]
          }
        ]);
        checked = false;
      }
    }
    if (checked) {
      register({ variables: { email, password, fullname, dialing_code: "+84", phone, locale: "en" } })
        .then((response: any) => {
          if (response && response.data && response.data.createUser) {
            Toast.fire({
              icon: "success",
              title: "Register successfully"
            });
            setTimeout(() => {
              navigate(`/admin/login`);
            }, 2000);
          }
        })
        .catch((err: any) => {
          Toast.fire({
            icon: "error",
            title: "Username or password is constraint unique key"
          });
        });
      /* axiosServices
        .post("/user/register", dataSaved, {
          headers: { isShowLoading: true, "content-type": "application/json" }
        })
        .then((res: any) => {
          const { statusCode, message } = res.data;
          if (parseInt(statusCode) === 200 || parseInt(statusCode) === 201) {
            Toast.fire({
              icon: "success",
              title: "Register successfully"
            });
            setTimeout(() => {
              navigate(`/admin/login`);
            }, 2000);
          } else {
            Toast.fire({
              icon: "error",
              title: "Username or password is constraint unique key"
            });
          }
        })
        .catch((err: any) => {
          Toast.fire({
            icon: "error",
            title: "Username or password is constraint unique key"
          });
        }); */
    }
  };
  const handleLogin = () => {
    navigate("/admin/login");
  };
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {};
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {};
  return (
    <Form form={frmSignup} layout="vertical" onFinish={onFinish} name="registeFrm">
      <Flex justify="center" align="center" style={{ height: "100vh" }}>
        <Card
          title="Register"
          extra={
            <Button type="primary" size="large" onClick={handleLogin}>
              Login
            </Button>
          }
          style={{ width: 300 }}
        >
          <Form.Item<FieldType>
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              {
                type: "email",
                message: "Please input valid email"
              }
            ]}
          >
            <Input onBlur={handleEmailChange} />
          </Form.Item>
          <Form.Item<FieldType>
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message: "Password needs to be checked: cannot be empty, length between 8-20, containing at least one uppercase, one lowercase, one number, and one special symbol",
                pattern: new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,20}$")
              }
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item<FieldType> label="Password retype" name="password_confirmed" rules={[{ required: true, message: "Please input your retyped password!" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item<FieldType> label="Fullname" name="fullname" rules={[{ required: true, message: "Please input your fullname!" }]}>
            <Input />
          </Form.Item>
          <Form.Item<FieldType> label="Phone" name="phone" rules={[{ required: true, message: "Please input your phone!" }]}>
            <Input />
          </Form.Item>
          {isDuplicate.isDuplicateUsername === false && isDuplicate.isDuplicateEmail === false ? (
            <Button htmlType="submit" type="primary" size="large">
              Submit
            </Button>
          ) : (
            <Button htmlType="button" type="dashed" size="large">
              Submit
            </Button>
          )}
        </Card>
      </Flex>
    </Form>
  );
};
export default RegisterPage;
