import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

/** 后台业务接口不允许 H5 短信登录会话访问。 */
@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const user = context.switchToHttp().getRequest().user;
    if (!user?.userId || user?.h5UserId) throw new ForbiddenException("仅后台账号可访问");
    return true;
  }
}
