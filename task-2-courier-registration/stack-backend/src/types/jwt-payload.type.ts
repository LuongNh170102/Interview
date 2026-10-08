type JwtPayload = {
  _id: string;
  username: string;
  email: string;
  fullname: string;
  token: string;
};
type JwtPayloadWithRefreshToken = JwtPayload & {
  refreshToken: string;
};
export { JwtPayload, JwtPayloadWithRefreshToken };
