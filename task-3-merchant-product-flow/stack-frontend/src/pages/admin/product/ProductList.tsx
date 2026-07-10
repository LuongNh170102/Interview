import { AxiosService } from "@/utils";
import { PlusOutlined } from "@ant-design/icons";
import { Table, type TableProps, Card, type GetProp } from "antd";
import clsx from "clsx";
import React from "react";
import { useTranslation } from "react-i18next";
import { AppButton } from "@/components";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { produce } from "immer";
type TablePaginationConfig = Exclude<GetProp<TableProps, "pagination">, boolean>;
interface DataType {
  key: string;
  name: string;
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  address: string;
}
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
interface TableParams {
  pagination?: TablePaginationConfig;
  sortField?: string;
  sortOrder?: string;
  filters?: Parameters<GetProp<TableProps, "onChange">>[1];
}
const ProductList = () => {
  const columns: TableProps<DataType>["columns"] = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text) => <span>{text}</span>
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <span>{text}</span>
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (text) => <span>{text}</span>
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      render: (text) => <span>{text}</span>
    },
    {
      title: "",
      key: "action",
      render: (_, record) => (
        <div className={clsx(["flex", "justify-center", "gap-x-6"])}>
          <button className={clsx(["cursor-pointer"])} onClick={handleEdit(record.id)}>
            {t("Edit")}
          </button>
          <button className={clsx(["cursor-pointer"])} onClick={handleDelete(record.id)}>
            {t("Delete")}
          </button>
        </div>
      )
    }
  ];
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tableParams, setTableParams] = React.useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 5
    }
  });
  const [productList, setProductList] = React.useState<DataType[]>([]);
  const loadProductList = () => {
    AxiosService()
      .get("/product/list", { headers: { isShowLoading: true } })
      .then((response: any) => {
        let total = 0;
        const { statusCode, data } = response.data;
        if (parseInt(statusCode) >= 200 && parseInt(statusCode) <= 299) {
          total = parseInt(data.total);
          let productList: DataType[] = data.productList;
          let nextState: DataType[] = produce(productList, (draft) => {
            draft.forEach((item: DataType) => {
              item.key = item.id ? item.id.toString() : "";
              item.name = item.lastname + " " + item.firstname;
            });
          });
          setProductList(nextState);
        } else {
          setProductList([]);
        }
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total
          }
        });
      });
  };
  React.useEffect(() => {
    loadProductList();
  }, []);
  const handleNewForm = () => {
    navigate("/admin/product/add");
  };
  const handleEdit = (id: number) => () => {
    navigate("/admin/product/edit/" + id);
  };
  const handleDelete = (id: number) => () => {
    Swal.fire({
      title: t("Do you want to delete this item?"),
      showDenyButton: true,
      confirmButtonText: "Confirm",
      denyButtonText: "Cancel"
    }).then((result) => {
      if (result.isConfirmed) {
        AxiosService()
          .delete("/product/delete/" + id, { headers: { isShowLoading: true } })
          .then((response: any) => {
            const { statusCode, message } = response.data;
            if (parseInt(statusCode) >= 200 && parseInt(statusCode) <= 299) {
              loadProductList();
              Toast.fire({
                icon: "success",
                title: t("Delete successfully")
              });
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
    });
  };
  return (
    <Card
      title={
        <div className={clsx(["flex", "justify-between"])}>
          <span className={clsx(["text-3xl"])}>{t("Product")}</span>
          <AppButton lblCtrl={t("New")} iconCtrl={<PlusOutlined />} onClickForm={handleNewForm} />
        </div>
      }
    >
      <Table<DataType> rowKey="id" columns={columns} dataSource={productList} pagination={tableParams.pagination} />
    </Card>
  );
};

export default ProductList;
