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
  sku: string;
  productName: string;
  price: string;
  featuredImage: string;
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
    const { sku, productName, price, featuredImage } = values;
    let actionUrl: string = "";
    if (productId) {
      actionUrl = "/product/update/" + productId;
    } else {
      actionUrl = "/product/create";
    }
    AxiosService()
      .post(actionUrl, { sku, productName, price, featuredImage }, { headers: { isShowLoading: true } })
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
              const { sku, productName, price, featuredImage } = data;
              frm.setFieldValue("sku", sku);
              frm.setFieldValue("productName", productName);
              frm.setFieldValue("price", price);
              frm.setFieldValue("featuredImage", featuredImage);
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
          <Col span={12}>
            <Form.Item<FieldType> label={t("Sku")} name="sku" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item<FieldType> label={t("Product name")} name="productName" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}></Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item<FieldType> label={t("Price")} name="price" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item<FieldType> label={t("Image")} name="featuredImage" rules={[{ required: true }]}>
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
