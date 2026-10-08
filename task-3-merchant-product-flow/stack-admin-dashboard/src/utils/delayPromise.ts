const delayLazyLoad = (promise: any) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, 2000);
  }).then(() => promise);
};
export { delayLazyLoad };
