import { CurrentUser, Public, ResponseMessage } from "@/src/decorator/customize";
import { IUser } from "@/src/types/user.type";
import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateAuthDto } from "./dto";
import { LocalAuthGuard } from "./local-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @ResponseMessage("Login user successfully")
  @Post("login")
  login(@CurrentUser() user: IUser) {
    return this.auth.login(user);
  }

  @ResponseMessage("Check valid token successfully")
  @Post("check-valid-token")
  checkValidToken(@Body() createAuthDto: CreateAuthDto, @CurrentUser() user: IUser) {
    return this.auth.checkValidToken(createAuthDto, user);
  }

  @Get("profile")
  getProfile(@CurrentUser() user: IUser) {
    return user;
  }

  @Get("logout")
  logout(@CurrentUser() user: IUser) {
    return this.auth.logout(user);
  }
}
