import styleProductDetail from "@/assets/scss/product-detail.module.scss";
import { AxiosService, delayLazyLoad, formatCurrency, getUriImage } from "@/utils";
import { BackwardFilled } from "@ant-design/icons";
import type { TableProps } from "antd";
import { Button, Card, Col, Flex, Row, Spin, Splitter, Table, Typography } from "antd";
import clsx from "clsx";
import { produce } from "immer";
import { Fragment, lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
const { Title } = Typography;
interface IOrder {
  ordersSku?: string;
  ordersDateTime?: string;
  ordersName?: string;
  ordersMobile?: string;
  ordersAmount?: number;
  paymentMethod?: string;
}
interface ICart {
  id: number;
  key: string;
  productSku: string;
  productName: string;
  productPrice: number;
  quantity: number;
  amount: number;
  productFeaturedImage: string;
}
const ImageProduct = lazy(() => delayLazyLoad(import("@/components/ImageProduct")));
const OrdersFrm = () => {
  const navigate = useNavigate();
  const { action, orderId } = useParams();
  const [orderItem, setOrderItem] = useState<IOrder>({});
  const [cart, setCart] = useState<ICart[]>([]);
  const { t } = useTranslation();
  const handleBack = () => {
    navigate("/admin/orders/list");
  };
  useEffect(() => {
    const loadOrdersDetail = async () => {
      if (action && orderId && action === "detail") {
        setOrderItem({});
        const res: any = await AxiosService().get(`/orders/detail/${orderId.toString()}`, {
          headers: { isShowLoading: false }
        });
        const { statusCode, data } = res.data;
        if (parseInt(statusCode) === 200 || parseInt(statusCode) === 201) {
          const { ordersCode, ordersDate, customerName, customerPhone, ordersDetail } = data;
          const d = new Date(ordersDate);
          const ordersDateTime: string = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")} ${d
            .getHours()
            .toString()
            .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;

          if (ordersDetail && ordersDetail.length > 0) {
            const ordersData: ICart[] = ordersDetail;
            const nextState: ICart[] = produce(ordersData, (draft: ICart[]) => {
              draft.forEach((elmt: ICart, idx: number) => {
                elmt.key = (idx + 1).toString();
                elmt.amount = elmt.productPrice * elmt.quantity;
              });
            });
            const totalAmount: number = nextState.reduce((total: number, cartItem: ICart) => {
              return total + cartItem.amount;
            }, 0);
            setOrderItem({
              ordersSku: ordersCode,
              ordersDateTime,
              ordersName: customerName,
              ordersMobile: customerPhone,
              ordersAmount: totalAmount
            });
            setCart(nextState);
          }
        }
      }
    };
    loadOrdersDetail();
  }, [orderId, action]);
  const columns: TableProps<ICart>["columns"] = [
    {
      title: "ProductSku",
      dataIndex: "productSku",
      key: "productSku"
    },
    {
      title: "ProductName",
      dataIndex: "productName",
      key: "productName"
    },
    {
      title: "Price",
      dataIndex: "productPrice",
      key: "productPrice",
      render: (_, record) => {
        return formatCurrency(record.productPrice);
      }
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity"
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (_, record) => {
        return formatCurrency(record.amount);
      }
    },
    {
      title: "Image",
      dataIndex: "productFeaturedImage",
      key: "productFeaturedImage",
      render: (_, record) => {
        return (
          <Fragment>
            {record.productFeaturedImage ? (
              <Suspense
                fallback={
                  <Flex justify="center" align="center" className={clsx(["w-full"])}>
                    <Spin size="large" />
                  </Flex>
                }
              >
                <ImageProduct urlImage={`${getUriImage(record.productFeaturedImage)}`} width={50} />
              </Suspense>
            ) : (
              <Fragment></Fragment>
            )}
          </Fragment>
        );
      }
    }
  ];
  return (
    <Card
      title={
        <div className={clsx(["flex", "justify-between"])}>
          <Title level={2}>{t("Orders")}</Title>
          <Button type="primary" icon={<BackwardFilled />} size="large" danger onClick={handleBack} />
        </div>
      }
    >
      <Row>
        <Col span={24}>
          <Row>
            <Col span={12}>
              <Table<ICart> columns={columns} dataSource={cart} pagination={false} />
            </Col>
            <Col span={12}>
              <Splitter style={{ boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)", padding: 20 }}>
                <Splitter.Panel>
                  <Row>
                    <Col span={8}>
                      <Title level={5}>Name</Title>
                      <div>{orderItem.ordersName ? orderItem.ordersName : ""}</div>
                    </Col>
                    <Col span={8}>
                      <Title level={5}>Payment method</Title>
                      <div>{orderItem.paymentMethod ? orderItem.paymentMethod : ""}</div>
                    </Col>
                    <Col span={8}>
                      <Title level={5}>Order sku</Title>
                      <div>{orderItem.ordersSku ? orderItem.ordersSku : ""}</div>
                    </Col>
                  </Row>
                  <Row className={styleProductDetail.productRowDetail}>
                    <Col span={8}>
                      <Title level={5}>Mobile</Title>
                      <div>{orderItem.ordersMobile ? orderItem.ordersMobile : ""}</div>
                    </Col>
                    <Col span={8}>
                      <Title level={5}>Amount</Title>
                      <div>{orderItem.ordersAmount ? formatCurrency(orderItem.ordersAmount) : "0"}</div>
                    </Col>
                    <Col span={8}>
                      <Title level={5}>Order date</Title>
                      <div>{orderItem.ordersDateTime ? orderItem.ordersDateTime : ""}</div>
                    </Col>
                  </Row>
                </Splitter.Panel>
              </Splitter>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
};

export default OrdersFrm;
