import { AppButton } from "@/components";
import { AxiosService, getUriBackend } from "@/utils";
import { DeleteOutlined, RollbackOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, Row, type FormProps } from "antd";
import clsx from "clsx";
import React from "react";
import { FileUploader } from "react-drag-drop-files";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
type FieldType = {
  sku: string;
  productName: string;
  price: string;
  featuredImage: string;
  imageFile: any;
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
  const [base64Url, setBase64Url] = React.useState<string>("");
  const [featuredImg, setFeaturedImg] = React.useState<any | null>(null);
  const [hiddenImg, setHiddenImg] = React.useState<string>("");
  const handleBack = () => {
    navigate("/admin/product/list");
  };
  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    let imageFile: string = "";
    if (featuredImg) {
      let frmData = new FormData();
      frmData.append("mediaFile", featuredImg);
      const uploadFeaturedImgRes = await AxiosService().post("/media-file/upload-file", frmData, { headers: { isShowLoading: true, "Content-Type": "multipart/form-data" } });
      imageFile = uploadFeaturedImgRes.data.data;
    } else {
      if (base64Url) {
        imageFile = hiddenImg;
      }
    }
    const { sku, productName, price } = values;
    let actionUrl: string = "";
    let frmData = new FormData();
    if (productId) {
      frmData.append("id", productId);
      actionUrl = "/product/update/" + productId;
    } else {
      actionUrl = "/product/create";
    }
    AxiosService()
      .post(actionUrl, { sku, productName, price, featuredImage: imageFile }, { headers: { isShowLoading: true } })
      .then((response: any) => {
        console.log("response = ", response);
        const { statusCode, data } = response.data;
        if (parseInt(statusCode) >= 200 && parseInt(statusCode) <= 299) {
          if (productId) {
            Toast.fire({
              icon: "success",
              title: t("Update successfully")
            });
          } else {
            Toast.fire({
              icon: "success",
              title: t("Create successfully")
            });
          }
          navigate("/admin/product/edit/" + data.id);
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
              setBase64Url(featuredImage ? `${getUriBackend()}/images/${featuredImage}` : "");
              setHiddenImg(featuredImage);
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
  const handleUpload = (imageFile: any) => {
    setBase64Url(URL.createObjectURL(imageFile));
    setFeaturedImg(imageFile);
  };
  const handleRemoveFeaturedImg = () => {
    setBase64Url("");
    setFeaturedImg(null);
  };
  const handleTypeError = () => {
    Toast.fire({
      icon: "warning",
      title: "File type must be .png | .jpg"
    });
  };
  const handleSizeError = () => {
    Toast.fire({
      icon: "warning",
      title: "Image file size must be less then 500KB"
    });
  };
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
            <div className={clsx("flex", "flex-row", "gap-x-3", "items-center", "h-full")}>
              <FileUploader
                name="mediaFile"
                multiple={false}
                types={["JPG", "PNG", "JPEG"]}
                hoverTitle="Drop here"
                handleChange={handleUpload}
                onTypeError={handleTypeError}
                onSizeError={handleSizeError}
                maxSize={0.5}
              >
                <Button type="primary" size="large" icon={<UploadOutlined />}>
                  Upload
                </Button>
              </FileUploader>
              <Button type="primary" icon={<DeleteOutlined />} size="large" danger onClick={handleRemoveFeaturedImg}>
                Remove
              </Button>
            </div>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            {base64Url ? (
              <div className={clsx(["flex", "mt-10", "justify-center"])}>
                <img src={base64Url} width={300} height={130} />
              </div>
            ) : (
              <React.Fragment></React.Fragment>
            )}
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
