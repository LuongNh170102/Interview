import { AppButton } from "@/components";
import { AxiosService } from "@/utils";
import { RollbackOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Row, Select, type FormProps } from "antd";
import clsx from "clsx";
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
type FieldType = {
  status_id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  address: string;
};
type IStatus = {
  label: string;
  value: string;
  id: number;
  tag_name: string;
  status_id: number;
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
const ProductForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { productId } = useParams();
  const [frm] = Form.useForm();
  const handleBack = () => {
    navigate("/admin/product/list");
  };
  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    const { email, firstname, lastname, phone, address, status_id } = values;
    let actionUrl: string = "";
    if (productId) {
      actionUrl = "/product/update/" + productId;
    } else {
      actionUrl = "/product/create";
    }
    AxiosService()
      .post(actionUrl, { email, firstname, lastname, phone, address, status_id: status_id ? parseInt(status_id) : 2 }, { headers: { isShowLoading: true } })
      .then((response: any) => {
        const { statusCode } = response.data;
        if (parseInt(statusCode) >= 200 && parseInt(statusCode) <= 299) {
          Toast.fire({
            icon: "success",
            title: t("Create successfully")
          });
          navigate("/admin/product/list");
        } else {
          Toast.fire({
            icon: "error",
            title: t("Error")
          });
        }
      })
      .catch((err: any) => {
        Toast.fire({
          icon: "error",
          title: t("Error")
        });
      });
  };
  React.useEffect(() => {
    const loadProductItem = () => {
      if (productId) {
        AxiosService()
          .get("/product/detail/" + productId, { headers: { isShowloading: true } })
          .then((response: any) => {
            const { statusCode, message, data } = response.data;
            if (parseInt(statusCode) >= 200 && parseInt(statusCode) <= 299) {
              const { email, firstname, lastname, phone, address, status_id } = data;
              frm.setFieldValue("email", email);
              frm.setFieldValue("firstname", firstname);
              frm.setFieldValue("lastname", lastname);
              frm.setFieldValue("phone", phone);
              frm.setFieldValue("address", address);
              frm.setFieldValue("status_id", status_id ? status_id.toString() : "2");
            } else {
              Toast.fire({
                icon: "error",
                title: t(message)
              });
            }
          })
          .catch((err: any) => {
            Toast.fire({
              icon: "error",
              title: err.data.message
            });
          });
      }
    };
    loadProductItem();
  }, [productId]);
  return (
    <Form name="basic" onFinish={onFinish} layout="vertical" form={frm}>
      <Card
        title={
          <div className={clsx(["flex", "justify-between"])}>
            <span className={clsx(["text-3xl", "uppercase"])}>{productId ? t("Edit product") : t("Create product")}</span>
            <AppButton lblCtrl={t("Back")} iconCtrl={<RollbackOutlined />} onClickForm={handleBack} />
          </div>
        }
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item<FieldType> label={t("Firstname")} name="firstname" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item<FieldType> label={t("Lastname")} name="lastname" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}></Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item<FieldType> label={t("Phone")} name="phone" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item<FieldType> label={t("Email")} name="email" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item<FieldType> label={t("Address")} name="address" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Form.Item label={null}>
              <Button type="primary" htmlType="submit">
                {t("Save")}
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default ProductForm;
