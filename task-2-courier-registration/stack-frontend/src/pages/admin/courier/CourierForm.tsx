import { AppButton } from "@/components";
import Swal from "sweetalert2";
import React from "react";
import { AxiosService } from "@/utils";
import { RollbackOutlined } from "@ant-design/icons";
import { Card, Col, Form, Input, Row, type FormProps, Button, Select } from "antd";
import clsx from "clsx";
import { produce } from "immer";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
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
const CourierForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { courier_id } = useParams();
  const [frm] = Form.useForm();
  const [statusList, setStatusList] = React.useState<IStatus[]>([]);
  const handleBack = () => {
    navigate("/admin/courier/list");
  };
  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    const { email, firstname, lastname, phone, address, status_id } = values;
    let actionUrl: string = "";
    if (courier_id) {
      actionUrl = "/courier/update/" + courier_id;
    } else {
      actionUrl = "/courier/create";
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
          navigate("/admin/courier/list");
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
    const loadCourierItem = () => {
      if (courier_id) {
        AxiosService()
          .get("/courier/detail/" + courier_id, { headers: { isShowloading: true } })
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
    loadCourierItem();
  }, [courier_id]);
  React.useEffect(() => {
    const loadStatusList = () => {
      AxiosService()
        .get("/status/list", { headers: { isShowLoading: true } })
        .then((response: any) => {
          const { data, statusCode, message } = response.data;
          if (parseInt(statusCode) >= 200 && parseInt(statusCode) <= 299) {
            const list: IStatus[] = data;
            const nextState = produce(list, (draft) => {
              draft.forEach((item: IStatus) => {
                item.label = item.tag_name.toString().trim().toUpperCase();
                item.value = item.id.toString().trim();
              });
            });
            setStatusList(nextState);
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
            title: err.data && err.data.message ? err.data.message : ""
          });
        });
    };
    loadStatusList();
  }, []);
  return (
    <Form name="basic" onFinish={onFinish} layout="vertical" form={frm}>
      <Card
        title={
          <div className={clsx(["flex", "justify-between"])}>
            <span className={clsx(["text-3xl", "uppercase"])}>{courier_id ? t("Edit courier") : t("Create courier")}</span>
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
          <Col span={8}>
            <Form.Item<FieldType> label={t("Status")} name="status_id" rules={[{ required: true }]}>
              <Select defaultValue="2" allowClear placeholder={t("Select a option and change input text above")} options={statusList} />
            </Form.Item>
          </Col>
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

export default CourierForm;
