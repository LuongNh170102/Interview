"use client";
import React, { Fragment, useEffect, useState } from "react";
import clsx from "clsx";
import stylesCart from "@/scss/cart.module.scss";
import { produce } from "immer";
import { AxiosService, formatCurrency, getUriBackend, getUriImage } from "@/utils";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRemove } from "@fortawesome/free-solid-svg-icons";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
type IFormInput = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
};
interface ICart {
  id: number;
  sku: string;
  productName: string;
  featuredImage: string;
  price: number;
  quantity: number;
  amount: number;
  productId: number;
  productSku: string;
  productFeaturedImage: string;
  productPrice: number;
  ordersQuantity: number;
  ordersAmount: number;
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
interface IPaymentMethod {
  value: string;
  label: string;
}
const CheckoutPage = () => {
  const [cart, setCart] = useState<ICart[]>([]);
  useEffect(() => {
    if (sessionStorage.getItem("cart")) {
      const cartData: ICart[] = JSON.parse(sessionStorage.getItem("cart") as string);
      setCart(cartData);
    }
  }, []);
  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors }
  } = useForm<IFormInput>({
    defaultValues: {}
  });
  const onSubmit: SubmitHandler<IFormInput> = async (values) => {
    const { customerName, customerPhone, customerEmail, customerAddress } = values;
    try {
      let checked: boolean = true;
      if (!sessionStorage.getItem("cart")) {
        checked = false;
        Toast.fire({
          icon: "error",
          title: "Please update cart"
        });
      }
      if (checked) {
        const cartSession: ICart[] = JSON.parse(sessionStorage.getItem("cart") as string);
        const ordersProductJson: string = JSON.stringify(cartSession);
        let dataSaved: any = {
          customerName,
          customerPhone,
          customerEmail,
          customerAddress,
          ordersProductJson
        };
        let ordersCreatedResponse: any = await AxiosService().post("/orders/create", dataSaved, { headers: { isShowLoading: true, "Content-Type": "application/json" } });
        if (ordersCreatedResponse && ordersCreatedResponse.data) {
          const { statusCode } = ordersCreatedResponse.data;
          if (parseInt(statusCode) >= 200 && parseInt(statusCode) <= 299) {
            sessionStorage.removeItem("cart");
            Toast.fire({
              icon: "success",
              title: "Create order successfully"
            });
          }
        }
      }
    } catch (err: any) {
      Toast.fire({
        icon: "error",
        title: err.message
      });
    }
  };
  return (
    <Fragment>
      <div className={clsx(["max-w-7xl", "mx-auto", "mt-5"])}>
        <table className={clsx([stylesCart.table, "mx-auto", "w-full"])}>
          <tr>
            <th>Sku</th>
            <th>Product name</th>
            <th>Thumbnail</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Amount</th>
          </tr>
          {cart &&
            cart.length > 0 &&
            cart.map((elmt: ICart, idx: number) => {
              return (
                <tr key={`cart-idx-${idx}`}>
                  <td>{elmt.sku}</td>
                  <td className={clsx(["w-100"])}>{elmt.productName}</td>
                  <td className={clsx(["flex", "justify-center"])}>
                    <img src={getUriImage(elmt.featuredImage)} width={80} height={53} />
                  </td>
                  <td className={clsx(["text-right"])}>{formatCurrency(elmt.price)}</td>
                  <td className={clsx(["text-center"])}>{elmt.quantity}</td>
                  <td className={clsx(["text-right"])}>{formatCurrency(elmt.amount)}</td>
                </tr>
              );
            })}
        </table>
        <form onSubmit={handleSubmit(onSubmit)} className={clsx(["grid", "mt-5", "grid-cols-2", "gap-x-10", "gap-y-5"])}>
          <div>
            <div>Name</div>
            <Controller
              name="customerName"
              defaultValue=""
              control={control}
              rules={{ required: true }}
              render={({ field }) => {
                return (
                  <div className={clsx(["mt-1"])}>
                    <input placeholder="Name" autoCapitalize="none" {...field} className={clsx(["outline-0", "border", "border-gray-300", "py-2", "px-3", "rounded-md", "w-full"])} />
                    {errors.customerName && <div className={clsx(["text-red-500", "text-xs"])}>{errors.customerName.message}</div>}
                  </div>
                );
              }}
            />
          </div>
          <div>
            <div>Phone</div>
            <Controller
              name="customerPhone"
              defaultValue=""
              control={control}
              rules={{ required: true }}
              render={({ field }) => {
                return (
                  <div className={clsx(["mt-1"])}>
                    <input placeholder="Phone" autoCapitalize="none" {...field} className={clsx(["outline-0", "border", "border-gray-300", "py-2", "px-3", "rounded-md", "w-full"])} />
                    {errors.customerPhone && <div className={clsx(["text-red-500", "text-xs"])}>{errors.customerPhone.message}</div>}
                  </div>
                );
              }}
            />
          </div>
          <div>
            <div>Email</div>
            <Controller
              name="customerEmail"
              defaultValue=""
              control={control}
              rules={{ required: true }}
              render={({ field }) => {
                return (
                  <div className={clsx(["mt-1"])}>
                    <input placeholder="Email" autoCapitalize="none" {...field} className={clsx(["outline-0", "border", "border-gray-300", "py-2", "px-3", "rounded-md", "w-full"])} />
                    {errors.customerEmail && <div className={clsx(["text-red-500", "text-xs"])}>{errors.customerEmail.message}</div>}
                  </div>
                );
              }}
            />
          </div>
          <div>
            <div>Address</div>
            <Controller
              name="customerAddress"
              defaultValue=""
              control={control}
              rules={{ required: true }}
              render={({ field }) => {
                return (
                  <div className={clsx(["mt-1"])}>
                    <input placeholder="Address" autoCapitalize="none" {...field} className={clsx(["outline-0", "border", "border-gray-300", "py-2", "px-3", "rounded-md", "w-full"])} />
                    {errors.customerAddress && <div className={clsx(["text-red-500", "text-xs"])}>{errors.customerAddress.message}</div>}
                  </div>
                );
              }}
            />
          </div>
          <div>
            <button type="submit" className={clsx(["bg-red-600", "px-2", "py-2", "rounded-md", "text-white", "cursor-pointer"])}>
              Sbumit
            </button>
          </div>
        </form>
      </div>
    </Fragment>
  );
};

export default CheckoutPage;
