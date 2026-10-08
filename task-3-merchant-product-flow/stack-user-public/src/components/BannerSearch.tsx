import stylesBannerSearch from "@/scss/banner-search.module.scss";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
const BannerSearch = () => {
  return (
    <div className={clsx(["relative"])}>
      <div className={clsx("bg-[url(/bg-searchhome.png)]", "bg-no-repeat", "bg-cover", "py-40")}></div>
      <div className={clsx(["absolute", "top-0", "left-0", "w-full", "h-full", "py-10", "px-4"])}>
        <div className={clsx(["max-w-3xl", "ml-auto", "mr-auto", "h-full", "rounded-lg", "px-10", "py-15", stylesBannerSearch.searchBox])}>
          <div className={clsx(["bg-sky-100", "w-full", "py-1", "px-1", "rounded-md", "flex", "gap-x-4", "flex", "relative"])}>
            <div className={clsx(["h-full", "text-2xl", "flex", "max-sm:hidden", "items-center", "absolute", "top-0", "left-2", "text-gray-400"])}>
              <FontAwesomeIcon icon={faSearch} />
            </div>
            <input type="text" name="txtSearch" placeholder="Mua bán nhà" className={clsx(["px-10", "max-sm:px-2", "py-2", "outline-0", "grow", "rounded-md"])} />
            <button type="button" name="btnSearch" className={clsx(["bg-red-600", "text-white", "rounded-md", "px-4", "py-2", "cursor-pointer"])}>
              Tìm kiếm
            </button>
          </div>
          <div className={clsx(["flex", "justify-between", "max-md:flex-col", "max-md:gap-y-2", "gap-x-4", "mt-5"])}>
            <select name="cars" className={clsx(["border", "bg-sky-100", "pr-20", "pl-2", "rounded-md", "py-2", "text-left"])}>
              <option value="volvo">Loại nhà đất</option>
              <option value="saab">Saab</option>
              <option value="fiat">Fiat</option>
              <option value="audi">Audi</option>
            </select>
            <select name="cars" className={clsx(["border", "bg-sky-100", "pr-20", "pl-2", "rounded-md", "py-2", "text-left"])}>
              <option value="volvo">Khoảng giá</option>
              <option value="saab">Saab</option>
              <option value="fiat">Fiat</option>
              <option value="audi">Audi</option>
            </select>
            <select name="cars" className={clsx(["border", "bg-sky-100", "pr-20", "pl-2", "rounded-md", "py-2", "text-left"])}>
              <option value="volvo">Diện tích</option>
              <option value="saab">Saab</option>
              <option value="fiat">Fiat</option>
              <option value="audi">Audi</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export { BannerSearch };
