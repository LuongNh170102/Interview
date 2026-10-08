"use client";
import { Login, Logo, Register } from "@/components";
import stylesHeader from "@/scss/header.module.scss";
import { Link } from "@/utils";
import { faBars, faClose, faHouse, faUser, faKey, faEye, faMobile, faMailBulk } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import clsx from "clsx";
import Image from "next/image";
import React from "react";
import { redirect } from "next/navigation";

const Header = () => {
  const [isOpenModal, setOpenModal] = React.useState<boolean>(false);
  const [isOpenLogin, setOpenLogin] = React.useState<boolean>(false);
  const [isOpenRegister, setOpenRegister] = React.useState<boolean>(false);
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const menuModalRef = React.useRef<HTMLDivElement | null>(null);
  const logoHeaderRef = React.useRef<HTMLDivElement | null>(null);
  const menuHeaderRef = React.useRef<HTMLDivElement | null>(null);
  const headerRef = React.useRef<HTMLElement | null>(null);
  const maskRef = React.useRef<HTMLDivElement | null>(null);
  const loginFrmRef = React.useRef<HTMLDivElement | null>(null);
  const registerFrmRef = React.useRef<HTMLDivElement | null>(null);
  const menuSidebarRef = React.useRef<HTMLUListElement | null>(null);
  const arrowBuyRef = React.useRef<HTMLSpanElement | null>(null);
  const arrowRentRef = React.useRef<HTMLSpanElement | null>(null);
  const menuBuyRef = React.useRef<HTMLUListElement | null>(null);
  const menuRentRef = React.useRef<HTMLUListElement | null>(null);
  const [isMenuBuyActive, setMenuBuyActive] = React.useState<boolean>(false);
  const [isMenuRentActive, setMenuRentActive] = React.useState<boolean>(false);
  const handleOpenModal = (val: boolean) => () => {
    setOpenModal(val);
    if (modalRef && modalRef.current && maskRef && maskRef.current && menuModalRef && menuModalRef.current && loginFrmRef && loginFrmRef.current) {
      if (isOpenModal === true) {
        modalRef.current.classList.remove(stylesHeader.active);
        maskRef.current.classList.remove(stylesHeader.active);
        menuModalRef.current.classList.remove(stylesHeader.active);
      } else {
        modalRef.current.classList.add(stylesHeader.active);
        maskRef.current.classList.add(stylesHeader.active);
        menuModalRef.current.classList.add(stylesHeader.active);
        loginFrmRef.current.classList.remove(stylesHeader.active);
      }
    }
  };
  const handleMenuBuyDown = () => {
    if (arrowBuyRef && arrowBuyRef.current && menuBuyRef && menuBuyRef.current && menuRentRef && menuRentRef.current && arrowRentRef && arrowRentRef.current) {
      if (isMenuBuyActive) {
        arrowBuyRef.current.classList.add(stylesHeader.arrowUp);
        arrowBuyRef.current.classList.remove(stylesHeader.arrowDown);
        menuBuyRef.current.classList.add(stylesHeader.active);
        menuRentRef.current.classList.remove(stylesHeader.active);
        arrowRentRef.current.classList.remove(stylesHeader.arrowUp);
        arrowRentRef.current.classList.add(stylesHeader.arrowDown);
      } else {
        arrowBuyRef.current.classList.add(stylesHeader.arrowDown);
        arrowBuyRef.current.classList.remove(stylesHeader.arrowUp);
        menuBuyRef.current.classList.remove(stylesHeader.active);
      }
      setMenuBuyActive(!isMenuBuyActive);
    }
  };
  const handleMenuRentDown = () => {
    if (arrowRentRef && arrowRentRef.current && menuRentRef && menuRentRef.current && menuBuyRef && menuBuyRef.current && arrowBuyRef && arrowBuyRef.current) {
      if (isMenuRentActive) {
        arrowRentRef.current.classList.add(stylesHeader.arrowUp);
        arrowRentRef.current.classList.remove(stylesHeader.arrowDown);
        menuRentRef.current.classList.add(stylesHeader.active);
        menuBuyRef.current.classList.remove(stylesHeader.active);
        arrowBuyRef.current.classList.remove(stylesHeader.arrowUp);
        arrowBuyRef.current.classList.add(stylesHeader.arrowDown);
      } else {
        arrowRentRef.current.classList.add(stylesHeader.arrowDown);
        arrowRentRef.current.classList.remove(stylesHeader.arrowUp);
        menuRentRef.current.classList.remove(stylesHeader.active);
      }
      setMenuRentActive(!isMenuRentActive);
    }
  };
  const onScroll = () => {
    let scrollY: number = window.scrollY;
    if (headerRef && headerRef.current && menuHeaderRef && menuHeaderRef.current && logoHeaderRef && logoHeaderRef.current) {
      let headerHeight: number = headerRef.current.clientHeight;
      let logoHeaderHeight: number = logoHeaderRef.current.clientHeight;
      if (scrollY > headerHeight) {
        logoHeaderRef.current.classList.add("fixed", "top-0", "left-0", "w-full", "z-1", "bg-white");
        menuHeaderRef.current.style.position = "fixed";
        menuHeaderRef.current.style.top = `${logoHeaderHeight}px`;
        menuHeaderRef.current.style.left = "50%";
        menuHeaderRef.current.style.marginLeft = "-1280px";
        menuHeaderRef.current.style.zIndex = "1";
        menuHeaderRef.current.style.width = "160rem";
      } else {
        logoHeaderRef.current.classList.remove("fixed", "top-0", "left-0", "w-full", "z-1", "bg-white");
        menuHeaderRef.current.style.position = "static";
        menuHeaderRef.current.style.top = "0";
        menuHeaderRef.current.style.left = "0";
        menuHeaderRef.current.style.marginLeft = "0";
        menuHeaderRef.current.style.zIndex = "0";
        menuHeaderRef.current.style.width = "auto";
      }
    }
  };
  React.useEffect(() => {
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  const handleLoginOpen = (val: boolean) => () => {
    setOpenLogin(val);
    if (modalRef && modalRef.current && maskRef && maskRef.current && loginFrmRef && loginFrmRef.current && menuModalRef && menuModalRef.current && registerFrmRef && registerFrmRef.current) {
      if (isOpenLogin === true) {
        modalRef.current.classList.remove(stylesHeader.active);
        maskRef.current.classList.remove(stylesHeader.active);
        loginFrmRef.current.classList.remove(stylesHeader.active);
      } else {
        modalRef.current.classList.add(stylesHeader.active);
        maskRef.current.classList.add(stylesHeader.active);
        loginFrmRef.current.classList.add(stylesHeader.active);
        loginFrmRef.current.style.zIndex = "0";
        menuModalRef.current.classList.remove(stylesHeader.active);
        registerFrmRef.current.classList.remove(stylesHeader.active);
        registerFrmRef.current.style.zIndex = "-999";
      }
    }
  };
  const handleRegisterOpen = (val: boolean) => () => {
    setOpenRegister(val);
    if (modalRef && modalRef.current && maskRef && maskRef.current && loginFrmRef && loginFrmRef.current && menuModalRef && menuModalRef.current && registerFrmRef && registerFrmRef.current) {
      if (isOpenRegister === true) {
        modalRef.current.classList.remove(stylesHeader.active);
        maskRef.current.classList.remove(stylesHeader.active);
        registerFrmRef.current.classList.remove(stylesHeader.active);
      } else {
        modalRef.current.classList.add(stylesHeader.active);
        maskRef.current.classList.add(stylesHeader.active);
        registerFrmRef.current.classList.add(stylesHeader.active);
        registerFrmRef.current.style.zIndex = "0";
        menuModalRef.current.classList.remove(stylesHeader.active);
        loginFrmRef.current.classList.remove(stylesHeader.active);
        loginFrmRef.current.style.zIndex = "-999";
      }
    }
  };
  const handleCheckinCart = () => {
    redirect("/cart");
  };
  return (
    <React.Fragment>
      <header ref={headerRef}>
        <div ref={logoHeaderRef}>
          <div className={clsx(["max-w-7xl", "ml-auto", "mr-auto", "flex", "items-center", "py-5", "justify-between", "max-xl:justify-center", "relative"])}>
            <Link href={{ pathname: "/" }} className={clsx(["font-bold", "text-4xl", "font-(family-name:--font-jost)"])}>
              <Logo />
            </Link>
            <div className={clsx(["max-xl:hidden"])}>
              <Image src="/an-cu-lac-nghiep.gif" alt="Website" width={600} height={400} className={clsx(["w-full", "h-full"])} />
            </div>
            <div className={clsx(["max-xl:hidden", "flex", "gap-x-3", "items-center", "justify-end"])}>
              <button type="button" className={clsx(["cursor-pointer"])} onClick={handleLoginOpen(true)}>
                Đăng nhập
              </button>
              <span className={clsx(["text-gray-200"])}>|</span>
              <button type="button" className={clsx(["cursor-pointer"])} onClick={handleRegisterOpen(true)}>
                Đăng ký
              </button>
              <button type="button" className={clsx(["bg-red-600", "text-white", "font-bold", "pl-4", "pr-4", "pt-2", "pb-2", "rounded-lg", "cursor-pointer"])} onClick={handleCheckinCart}>
                Giỏ hàng
              </button>
            </div>
            <div className={clsx(["hidden", "max-xl:flex", "absolute", "top-0", "left-0", "h-full", "px-3", "items-center"])}>
              <button role="button" className={clsx(["hidden", "max-xl:block", "cursor-pointer", "text-xl"])} onClick={handleOpenModal(true)}>
                <FontAwesomeIcon icon={faBars} />
              </button>
            </div>
          </div>
        </div>
        <div className={clsx(["max-xl:hidden", "bg-red-600", "px-4"])} ref={menuHeaderRef}>
          <div className={clsx(["max-w-7xl", "ml-auto", "mr-auto", "flex", "justify-between"])}>
            <ul className={clsx(["flex", stylesHeader.headerList])}>
              <li>
                <Link href={{ pathname: "/" }}>
                  <FontAwesomeIcon icon={faHouse} />
                </Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Giới thiệu</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Nhà đất bán</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Nhà đất cho thuê</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Sang nhượng</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Dự án</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Cẩm nang</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Tin tức</Link>
              </li>
              <li>
                <Link href={{ pathname: "/" }}>Liên hệ</Link>
              </li>
            </ul>
          </div>
        </div>
      </header>
      <div className={clsx(["fixed", "top-0", "left-0", "h-screen", "w-screen", stylesHeader.modal])} ref={modalRef}>
        <div className={clsx(["absolute", "top-0", "left-0", "w-screen", "h-screen", stylesHeader.maskModal])} ref={maskRef}></div>
        <div className={clsx(["absolute", "top-0", "left-0", "w-screen", "h-screen", "flex", "justify-center", "items-center", stylesHeader.loginFrm])} ref={loginFrmRef}>
          <div className={clsx(["w-3xl", "h-170", "bg-white", "rounded-md", "relative"])}>
            <button type="button" className={clsx(["cursor-pointer", "absolute", "-top-8", "border-4", "text-white", "border-gray-300", "rounded-full", "w-10", "h-10", "flex", "justify-center", "items-center", "-right-7", "text-xl"])} onClick={handleLoginOpen(false)}>
              <FontAwesomeIcon icon={faClose} />
            </button>
            <Login />
          </div>
        </div>
        <div className={clsx(["absolute", "top-0", "left-0", "w-screen", "h-screen", "flex", "justify-center", "items-center", stylesHeader.registerFrm])} ref={registerFrmRef}>
          <div className={clsx(["w-3xl", "h-170", "bg-white", "rounded-md", "relative"])}>
            <button type="button" className={clsx(["cursor-pointer", "absolute", "-top-8", "border-4", "text-white", "border-gray-300", "rounded-full", "w-10", "h-10", "flex", "justify-center", "items-center", "-right-7", "text-xl"])} onClick={handleRegisterOpen(false)}>
              <FontAwesomeIcon icon={faClose} />
            </button>
            <Register />
          </div>
        </div>
        <div className={clsx(["absolute", "top-0", "left-0", "w-80", "h-screen", "bg-white", "px-6", "py-3", stylesHeader.menuModal])} ref={menuModalRef}>
          <div className={clsx(["flex", "items-center", "justify-center", "text-2xl", "font-bold", "relative"])}>
            <Logo />
            <button role="button" className={clsx(["top-0", "right-0", "cursor-pointer", "text-xl", "absolute"])} onClick={handleOpenModal(false)}>
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
          <div className={clsx(["flex", "justify-center", "gap-x-5", "mt-3"])}>
            <Link href={{ pathname: "/" }}>Đăng nhập</Link>
            <Link href={{ pathname: "/" }}>Đăng ký</Link>
          </div>
          <button type="button" className={clsx(["bg-red-600", "w-full", "mt-5", "text-white", "font-bold", "pl-4", "pr-4", "pt-3", "pb-3", "rounded-lg", "cursor-pointer"])}>
            Đăng tin
          </button>
          <ul className={clsx(["mt-5", stylesHeader.menuSidebar])} ref={menuSidebarRef}>
            <li>
              <span className={clsx(["block", "flex", "justify-between", "items-center"])}>
                <Link href={{ pathname: "/" }}>Mua</Link>
                <button type="button" className={clsx(["cursor-pointer", stylesHeader.sidebarButton])} onClick={handleMenuBuyDown}>
                  <span className={clsx([stylesHeader.arrowDown])} ref={arrowBuyRef}>
                    &nbsp;
                  </span>
                </button>
              </span>
              <ul ref={menuBuyRef}>
                <li>
                  <Link href={{ pathname: "/" }}>Nhà mặt tiền</Link>
                </li>
                <li>
                  <Link href={{ pathname: "/" }}>Nhà hẻm</Link>
                </li>
                <li>
                  <Link href={{ pathname: "/" }}>Căn hộ chung cư</Link>
                </li>
                <li>
                  <Link href={{ pathname: "/" }}>Đất</Link>
                </li>
              </ul>
            </li>
            <li>
              <span className={clsx(["block", "flex", "justify-between", "items-center"])}>
                <Link href={{ pathname: "/" }}>Thuê</Link>
                <button type="button" className={clsx(["cursor-pointer", stylesHeader.sidebarButton])} onClick={handleMenuRentDown}>
                  <span className={clsx([stylesHeader.arrowDown])} ref={arrowRentRef}>
                    &nbsp;
                  </span>
                </button>
              </span>
              <ul ref={menuRentRef}>
                <li>
                  <Link href={{ pathname: "/" }}>Nhà</Link>
                </li>
                <li>
                  <Link href={{ pathname: "/" }}>Căn hộ chung cư</Link>
                </li>
                <li>
                  <Link href={{ pathname: "/" }}>Phòng trọ</Link>
                </li>
                <li>
                  <Link href={{ pathname: "/" }}>Đất</Link>
                </li>
                <li>
                  <Link href={{ pathname: "/" }}>Mặt bằng</Link>
                </li>
                <li>
                  <Link href={{ pathname: "/" }}>Văn phòng</Link>
                </li>
                <li>
                  <Link href={{ pathname: "/" }}>Kho, nhà xưởng</Link>
                </li>
              </ul>
            </li>
            <li>
              <Link href={{ pathname: "/" }}>Kho dự án</Link>
            </li>
            <li>
              <Link href={{ pathname: "/" }}>Vay thế chấp</Link>
            </li>
            <li>
              <Link href={{ pathname: "/" }}>Đối tá</Link>
            </li>
            <li>
              <Link href={{ pathname: "/" }}>Địa chỉ mới</Link>
            </li>
          </ul>
        </div>
      </div>
    </React.Fragment>
  );
};

export { Header };
