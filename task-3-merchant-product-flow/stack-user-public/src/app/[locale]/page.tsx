"use client";
import { AxiosService, formatCurrency, getUriBackend } from "@/utils";
import { faCheck, faShoppingCart, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import React, { Fragment, useState, useEffect } from "react";
import Swal from "sweetalert2";
type IProduct = {
  id: number;
  featuredImage: string;
  price: number;
  productName: string;
  sku: string;
  quantity: number;
  amount: number;
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
const HomePage = () => {
  const [productList, setProductList] = useState<IProduct[]>([]);
  const [productId, setProductId] = useState<number>(0);
  const loadData = async () => {
    const productRes: any = await AxiosService().get("/product/get-approved", { headers: { isShowLoading: true } });
    if (productRes && productRes.data) {
      const { data } = productRes.data;
      setProductList(data);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    setTimeout(() => {
      setProductId(0);
    }, 3000);
  }, [productId]);
  const handleAddCart = (id: number) => () => {
    let product: IProduct | undefined = productList.find((elmt) => elmt.id === id);
    if (product) {
      let cartData: IProduct[] = [];
      if (sessionStorage.getItem("cart")) {
        cartData = JSON.parse(sessionStorage.getItem("cart") as string);
        let cartItemFound: IProduct | undefined = cartData.find((elmt) => elmt.id === product.id);
        if (cartItemFound) {
          cartData.forEach((elmt: IProduct) => {
            if (elmt.id === cartItemFound.id) {
              elmt.quantity = cartItemFound.quantity + 1;
              elmt.amount = cartItemFound.price * elmt.quantity;
            }
          });
        } else {
          product.quantity = 1;
          product.amount = product.price;
          cartData.push(product);
        }
      } else {
        product.quantity = 1;
        product.amount = product.price;
        cartData.push(product);
      }
      sessionStorage.setItem("cart", JSON.stringify(cartData));
      setProductId(id);
    }
  };
  return (
    <div className={clsx(["bg-gray-100", "pt-4"])}>
      <div className={clsx(["max-w-7xl", "grid", "mx-auto", "grid-cols-5", "gap-x-2", "gap-y-2", "max-2xl:px-2"])}>
        {productList.length > 0 &&
          productList.map((elmt: IProduct, idx: number) => {
            return (
              <div key={`product-idx-${idx}`} className={clsx(["bg-white", "rounded-xl", "p-4"])}>
                <div className={clsx(["flex", "justify-center"])}>
                  <img src={`${getUriBackend()}/images/${elmt.featuredImage}`} width={600} height={400} />
                </div>
                <h4 className={clsx(["mt-3"])}>
                  <span className={clsx(["mt-3", "px-2", "py-1", "text-xs", "rounded-sm", "", "bg-gray-200"])}>Mã SP: {elmt.sku}</span>
                </h4>
                <h3 className={clsx(["mt-2", "font-bold"])}>{elmt.productName}</h3>
                <div className={clsx(["mt-2", "font-bold"])}>{formatCurrency(elmt.price)}</div>
                <div className={clsx(["mt-2", "text-xs", "gap-x-3", "flex"])}>
                  <span className={clsx(["text-gray-500", "line-through"])}>31.000.000đ</span>
                  <span className={clsx(["font-bold"])}>(Tiết kiệm 8%)</span>
                </div>
                <div className={clsx(["mt-4", "flex", "justify-between", "text-xs"])}>
                  <div className={clsx(["text-green-700"])}>
                    <FontAwesomeIcon icon={faCheck} /> Còn hàng
                  </div>
                  <div>
                    {productId === elmt.id ? (
                      <FontAwesomeIcon icon={faSpinner} />
                    ) : (
                      <Fragment>
                        <FontAwesomeIcon icon={faShoppingCart} />
                        <button type="button" className={clsx(["cursor-pointer"])} onClick={handleAddCart(elmt.id)}>
                          Thêm vào giỏ
                        </button>
                      </Fragment>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default HomePage;
