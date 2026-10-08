const getExpired = (dayNumber: number) => {
  const d = new Date();
  let timeForNextMonth: number = d.getTime() + dayNumber * 24 * 60 * 60 * 1000;
  d.setTime(timeForNextMonth);
  return d.toUTCString();
};
export { getExpired };
