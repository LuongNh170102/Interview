/**
 * axios setup to use mock service
 */

import axios from "axios";
import { getExpired } from "./expired-time";
import { hideLoading, showLoading } from "@/slices";
import { useAppDispatch } from "@/hooks";
import { getCookie } from "./cookie";
import { getUriBackend } from "./uri-backend";
const AxiosService = () => {
  /* const dispatch = useAppDispatch(); */
  const itemAxios: any = {
    baseURL: getUriBackend() as string,
    timeout: 10000
  };
  const axiosServices = axios.create(itemAxios);
  let requestCount: number | 0 = 0;
  axiosServices.interceptors.request.use(
    (config: any) => {
      const accessToken: string = getCookie(process.env.NEXT_PUBLIC_ACCESS_TOKEN_PREFIX as string);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      if (config.headers.isShowLoading) {
        requestCount++;
        /* dispatch(showLoading()); */
      }
      return config;
    },
    (err: any) => {
      if (err.config.headers.isShowLoading) {
        requestCount = requestCount - 1;
        /* if (requestCount === 0) {
          dispatch(hideLoading());
        } */
      }
      return Promise.reject(err.response);
    }
  );
  axiosServices.interceptors.response.use(
    (res: any) => {
      if (res.config.headers.isShowLoading) {
        requestCount = requestCount - 1;
        /* if (requestCount === 0) {
          dispatch(hideLoading());
        } */
      }
      return res;
    },
    (err: any) => {
      if (err.config.headers.isShowLoading) {
        requestCount = requestCount - 1;
        /* if (requestCount === 0) {
          dispatch(hideLoading());
        } */
      }
      if (err.response?.status === 401) {
        document.cookie = `${process.env.NEXT_PUBLIC_ACCESS_TOKEN_PREFIX as string}=token; expires=${getExpired(-100)}; path=/;`;
      }
      return Promise.reject(err.response);
    }
  );
  return axiosServices;
};
export { AxiosService };
