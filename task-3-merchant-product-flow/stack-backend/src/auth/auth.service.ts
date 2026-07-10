import { IUser } from "@/src/types";
import { prisma } from "@/src/utils";
import { BadGatewayException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compareSync } from "bcryptjs";
import { CreateAuthDto } from "./dto";
@Injectable()
export class AuthService {
  constructor(
    private confService: ConfigService,
    private jwt: JwtService
  ) {}

  validateUser = async (username: string, password: string) => {
    let user: any = null;
    user = await prisma.users.findUnique({ where: { username } });
    if (user) {
      const isValid = compareSync(password, user.password);
      if (isValid === true) {
        return user;
      }
    }
    return null;
  };
  login = async (user: IUser) => {
    const { id, username, phone, email, fullname } = user;
    const payload: any = {
      sub: "token login",
      iss: "from server",
      id,
      phone,
      email,
      fullname,
      username
    };
    const token: string = await this.jwt.sign(payload, {
      secret: this.confService.get<string>("JWT_ACCESS_TOKEN_SECRET")
    });
    await prisma.users.update({ where: { id }, data: { token } });
    return {
      user: {
        id,
        username,
        fullname,
        email,
        phone
      },
      token
    };
  };
  logout = async (user: IUser) => {
    const { id } = user;
    const data: any = await prisma.users.update({ where: { id }, data: { token: null } });
    return {
      user: {
        id: data && data.id ? data.id : 0,
        username: data && data.username ? data.username : "",
        fullname: data && data.fullname ? data.fullname : "",
        email: data && data.email ? data.email : "",
        phone: data && data.phone ? data.phone : ""
      },
      token: data.token
    };
  };
  checkValidToken = async (createAuthDto: CreateAuthDto, user: IUser) => {
    const userDecode: any = this.jwt.decode(createAuthDto.token ?? "", { complete: true });
    const payload: IUser = userDecode.payload;
    const signature: string = userDecode.signature;
    let item: IUser | null = null;
    if (payload.id === user.id && payload.username === user.username) {
      const data: any = await prisma.users.findFirstOrThrow({ where: { id: user.id, username: user.username } });
      if (data) {
        const tokenV2: string = data.token;
        const decodeV2: any = this.jwt.decode(tokenV2, { complete: true });
        const signatureV2: string = decodeV2.signature;
        if (signature === signatureV2) {
          item = user;
        } else {
          throw new BadGatewayException();
        }
      }
    }
    return { user: item };
  };
}
