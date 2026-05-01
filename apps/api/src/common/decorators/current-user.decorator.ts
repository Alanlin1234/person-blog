import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type JwtUser = { userId: string; email: string; roles: string[] };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as JwtUser;
  },
);
