"use client";
import clsx from "clsx";
import React, { Fragment, lazy, useEffect, useState } from "react";
import stylesCart from "@/scss/cart.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRemove } from "@fortawesome/free-solid-svg-icons";
import { produce } from "immer";
import _lodash from "lodash";
import { redirect } from "next/navigation";
import { formatCurrency, getUriImage } from "@/utils";
interface ICart {
  id: number;
  sku: string;
  productName: string;
  featuredImage: string;
  price: number;
  quantity: number;
  amount: number;
}
const Cart = () => {
  const [cart, setCart] = useState<ICart[]>([]);
  useEffect(() => {
    if (sessionStorage.getItem("cart")) {
      const cartData: ICart[] = JSON.parse(sessionStorage.getItem("cart") as string);
      setCart(cartData);
    }
  }, []);
  const handleQuantityChange = (id: number) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const quantity: number = parseInt(e.target.value as string);
    let cartClone: ICart[] = [];
    if (quantity === 0) {
      cartClone = cart.filter((item: ICart) => item.id != id);
    } else {
      let nextState: ICart[] = _lodash.cloneDeep(cart);
      nextState.forEach((elmt: ICart) => {
        if (elmt.id === id) {
          elmt.quantity = quantity;
          elmt.amount = elmt.price * quantity;
        }
      });
      cartClone = nextState;
    }
    sessionStorage.setItem("cart", JSON.stringify(cartClone));
    setCart(cartClone);
  };
  const handleRemoveItem = (id: number) => () => {
    const nextCartState: ICart[] = cart.filter((item: ICart) => item.id != id);
    sessionStorage.setItem("cart", JSON.stringify(nextCartState));
    setCart(nextCartState);
  };
  const handleCheckout = () => {
    redirect("/checkout");
  };
  const handleClearCart = () => {
    setCart([]);
    sessionStorage.removeItem("cart");
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
            <th></th>
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
                  <td className={clsx(["text-center"])}>
                    <input type="text" value={elmt.quantity} onChange={handleQuantityChange(elmt.id)} className={clsx(["text-center", "outline-0", "border", "w-20"])} />
                  </td>
                  <td className={clsx(["text-right"])}>{formatCurrency(elmt.amount)}</td>
                  <td className={clsx(["w-15", "text-center"])}>
                    <button type="button" className={clsx(["cursor-pointer"])} onChange={handleRemoveItem(elmt.id)}>
                      <FontAwesomeIcon icon={faRemove} />
                    </button>
                  </td>
                </tr>
              );
            })}
        </table>
        <div className={clsx(["flex", "gap-x-2", "mt-2", "justify-end"])}>
          <button type="button" className={clsx(["bg-red-600", "px-2", "py-2", "rounded-md", "text-white", "cursor-pointer"])} onClick={handleCheckout}>
            Checkout
          </button>
          <button type="button" className={clsx(["bg-red-600", "px-2", "py-2", "rounded-md", "text-white", "cursor-pointer"])} onClick={handleClearCart}>
            Clear cart
          </button>
        </div>
      </div>
    </Fragment>
  );
};

export default Cart;
