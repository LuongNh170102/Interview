const delayTimeout = (promise: any) => {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000);
  }).then(() => promise);
};
export { delayTimeout };
