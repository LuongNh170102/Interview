import { genSaltSync, hashSync } from "bcryptjs";
const getHashPassword = (password: string) => {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);
  return hash;
};
export { getHashPassword };
