import { AxiosService } from "@/utils";
import type { DatePickerProps, GetProps } from "antd";
import { Button, Card, Col, DatePicker, type GetProp, Input, Row, Space, Table, type TableProps, Typography } from "antd";
import clsx from "clsx";
import { produce } from "immer";
import React, { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
type TablePaginationConfig = Exclude<GetProp<TableProps, "pagination">, boolean>;
const { Title } = Typography;
interface IOrders {
  key: string;
  id: number;
  ordersCode: string;
  customerName: string;
  customerPhone: string;
  ordersDate: string;
}
interface IFilter {
  ordersCode?: string;
  customerName?: string;
  customerPhone?: string;
  ordersStartDate?: string;
  ordersEndDate?: string;
}
interface TableParams {
  pagination?: TablePaginationConfig;
  sortField?: string;
  sortOrder?: string;
  filters?: Parameters<GetProp<TableProps, "onChange">>[1];
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
const OrdersList = () => {
  const navigate = useNavigate();
  const [ordersData, setOrdersData] = React.useState<IOrders[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [filter, setFilter] = React.useState<IFilter>({});
  const { t } = useTranslation();
  const [tableParams, setTableParams] = React.useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10
    }
  });
  const columns: TableProps<IOrders>["columns"] = [
    {
      title: "Sku",
      dataIndex: "ordersCode",
      key: "ordersCode",
      render: (text) => text
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (text) => text
    },
    {
      title: "Mobile",
      dataIndex: "customerPhone",
      key: "customerPhone",
      render: (text) => text
    },
    {
      title: "Orders date",
      dataIndex: "ordersDate",
      key: "ordersDate",
      render: (text) => text
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        return (
          <Fragment>
            <Space size="middle">
              <Button type="primary" onClick={handleDetail(record.id)}>
                Detail
              </Button>
            </Space>
          </Fragment>
        );
      }
    }
  ];
  const handleDetail = (id: number) => () => {
    navigate(`/admin/orders/form/detail/${id}`);
  };
  const loadOrdersTable = (filter: IFilter, current: string | undefined) => {
    AxiosService()
      .get("/orders/list", {
        params: {
          ordersCode: filter.ordersCode ? filter.ordersCode.trim() : undefined,
          customerName: filter.customerName ? filter.customerName.trim() : undefined,
          customerPhone: filter.customerPhone ? filter.customerPhone.trim() : undefined,
          ordersStartDate: filter.ordersStartDate ? filter.ordersStartDate : undefined,
          ordersEndDate: filter.ordersEndDate ? filter.ordersEndDate : undefined,
          page: current ? current.toString() : "1",
          limit: tableParams.pagination?.pageSize?.toString()
        }
      })
      .then((res) => {
        const { statusCode, data, message } = res.data;
        if (parseInt(statusCode) >= 200 && parseInt(statusCode) <= 299) {
          const { orders, total } = data;
          setLoading(false);
          const items: IOrders[] = orders;
          const nextState: IOrders[] = produce(items, (drafState) => {
            drafState.forEach((item) => {
              item.key = item.id.toString();
              const d = new Date(item.ordersDate.toString());
              item.ordersDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")} ${d
                .getHours()
                .toString()
                .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
            });
          });
          setOrdersData(nextState);
          setTableParams({
            ...tableParams,
            pagination: {
              ...tableParams.pagination,
              total
            }
          });
        } else {
          Toast.fire({
            icon: "error",
            title: message
          });
        }
      })
      .catch((err: any) => {
        Toast.fire({
          icon: "error",
          title: err.message
        });
      });
  };
  React.useEffect(() => {
    setLoading(true);
    loadOrdersTable({}, "1");
  }, []);

  const handleOrdersNameChange = (e: any) => {
    setFilter({ ...filter, customerName: e.target.value.toString() });
  };
  const handleOrdersMobileChange = (e: any) => {
    setFilter({ ...filter, customerPhone: e.target.value.toString() });
  };
  const handleOrdersSkuChange = (e: any) => {
    setFilter({ ...filter, ordersCode: e.target.value.toString() });
  };
  const handleTableChange: TableProps<IOrders>["onChange"] = (pagination, filters) => {
    setTableParams({
      pagination,
      filters
    });

    // `dataSource` is useless since `pageSize` changed
    if (pagination.pageSize !== tableParams.pagination?.pageSize) {
      setOrdersData([]);
    }
  };
  const handleSearch = () => {
    loadOrdersTable(filter, tableParams.pagination?.current?.toString());
  };
  type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;

  const { RangePicker } = DatePicker;

  const onOk = (val: DatePickerProps["value"] | RangePickerProps["value"]) => {};
  const handleChangeRangePicker = (value: any, dateString: any) => {
    if (dateString && dateString.length > 0) {
      setFilter({ ...filter, ordersStartDate: dateString[0], ordersEndDate: dateString[1] });
    }
  };
  return (
    <Card
      title={
        <div className={clsx(["flex", "justify-between"])}>
          <Title level={2}>{t("Orders")}</Title>
        </div>
      }
    >
      <Row gutter={[16, 30]}>
        <Col span={12}>
          <Title level={5}>{t("Orders code")}</Title>
          <Input placeholder="Orders code..." size="large" onChange={handleOrdersSkuChange} value={filter.ordersCode ? filter.ordersCode : ""} />
        </Col>
        <Col span={12}>
          <Title level={5}>{t("Customer name")}</Title>
          <Input placeholder="Customer name..." size="large" onChange={handleOrdersNameChange} value={filter.customerName ? filter.customerName : ""} />
        </Col>
        <Col span={12}>
          <Title level={5}>{t("Customer phone")}</Title>
          <Input placeholder="Customer phone..." size="large" onChange={handleOrdersMobileChange} value={filter.customerPhone ? filter.customerPhone : ""} />
        </Col>
        <Col span={12}>
          <Title level={5}>{t("Orders date")}</Title>
          <RangePicker showTime={{ format: "HH:mm" }} size="large" format="YYYY-MM-DD HH:mm" onChange={handleChangeRangePicker} onOk={onOk} />
        </Col>
        <Col span={24}>
          <Button type="primary" htmlType="button" onClick={handleSearch}>
            Search
          </Button>
        </Col>
      </Row>
      <Table columns={columns} dataSource={ordersData} pagination={tableParams.pagination} loading={loading} onChange={handleTableChange} />
    </Card>
  );
};

export default OrdersList;
