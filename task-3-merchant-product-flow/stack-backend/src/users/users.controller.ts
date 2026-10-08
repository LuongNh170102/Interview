import { Public, ResponseMessage } from "@/src/decorator";
import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CreateUserDto } from "./dto";
import { UsersService } from "./users.service";
@Controller("users")
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Public()
  @ResponseMessage("Create user successfully")
  @Post("create")
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  /* @Public()
  @ResponseMessage("Check exist email")
  @Post("check-existed-email")
  checkExistedEmail(@Body("email") email: string) {
    return this.userService.findByEmail(email);
  } */

  @Public()
  @ResponseMessage("Get user by username and role param successfully")
  @Get(":username/:role")
  findByUsernameParam(@Param("username") username: string, @Param("role") role: string) {
    return { username, role };
  }

  @Public()
  @ResponseMessage("Get user by username and role query successfully")
  @Get()
  findByUsernameQuery(@Query("username") username: string, @Query("role") role: string) {
    return { username, role };
  }

  @Public()
  @ResponseMessage("Update password successfully")
  @Post()
  updatePassword(@Body("username") username: string, @Body("role") role: string) {
    return { username, role };
  }
}
