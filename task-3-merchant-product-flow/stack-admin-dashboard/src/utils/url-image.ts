const getUriImage = (val: string) => {
  let txt: string = `${import.meta.env.VITE_BACKEND_URI}/images/${val}`;
  return txt;
};
export { getUriImage };
