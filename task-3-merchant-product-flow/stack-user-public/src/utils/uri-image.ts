const getUriImage = (val: string) => {
  let txt: string = `${process.env.NEXT_PUBLIC_API_URL}/images/${val}`;
  return txt;
};
export { getUriImage };
