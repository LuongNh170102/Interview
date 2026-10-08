/**
 * axios setup to use mock service
 */

import axios from "axios";
import { getExpired } from "./expired-time";

const AxiosService = () => {
  /* const dispatch = useAppDispatch(); */
  const itemAxios: any = {
    baseURL: import.meta.env.VITE_BACKEND_URI as string,
    timeout: 10000
  };
  const authorizedAxiosInstance = axios.create(itemAxios);
  authorizedAxiosInstance.defaults.headers.common["Accept"] = "application/json";
  authorizedAxiosInstance.defaults.withCredentials = false;
  let requestCount: number | 0 = 0;
  authorizedAxiosInstance.interceptors.request.use(
    (config: any) => {
      config.headers["Accept"] = "application/json";
      const accessToken: string | null = localStorage.getItem(import.meta.env.VITE_ACCESS_TOKEN_PREFIX as string);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      if (config.headers.isShowLoading) {
        requestCount++;
        /* dispatch(showLoading()); */
      }
      return config;
    },
    (error: any) => {
      if (error.config.headers.isShowLoading) {
        requestCount = requestCount - 1;
        /* if (requestCount === 0) {
          dispatch(hideLoading());
        } */
      }
      return Promise.reject(error.response);
    }
  );
  authorizedAxiosInstance.interceptors.response.use(
    (res: any) => {
      if (res.config.headers.isShowLoading) {
        requestCount = requestCount - 1;
        /* if (requestCount === 0) {
          dispatch(hideLoading());
        } */
      }
      return res;
    },
    (error: any) => {
      if (error) {
        if (error.config.headers.isShowLoading) {
          requestCount = requestCount - 1;
          /* if (requestCount === 0) {
            dispatch(hideLoading());
          } */
        }
        const originalRequest: any = error.config;
        if (error.response && error.response.status) {
          if (parseInt(error.response.status) === 410 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken: string | null = localStorage.getItem(import.meta.env.VITE_REFRESH_TOKEN_PREFIX as string);
            if (refreshToken) {
            }
          }
          if (parseInt(error.response.status) !== 410) {
          }
        }
      }
      return Promise.reject(error.response);
    }
  );
  return authorizedAxiosInstance;
};
export { AxiosService };
