const getUriBackend = () => {
  return import.meta.env.VITE_BACKEND_URI;
};
export { getUriBackend };
