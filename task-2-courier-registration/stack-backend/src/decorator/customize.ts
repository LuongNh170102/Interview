import { ExecutionContext, SetMetadata, createParamDecorator } from "@nestjs/common";

const IS_PUBLIC_KEY = "isPublic";
const RESPONSE_MESSAGE = "response_message";
const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
const ResponseMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE, message);
const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
export { IS_PUBLIC_KEY, RESPONSE_MESSAGE, Public, ResponseMessage, CurrentUser };
