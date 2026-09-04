import { Controller, Get, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminOnlyGuard } from "@/common/guards/admin-only.guard";
import { LogService } from "./log.service";
import { LogQueryDto } from "./dto/log-query.dto";

/**
 * 日志接口控制器
 */
@ApiTags("09.日志接口")
@Controller("logs")
@UseGuards(AdminOnlyGuard)
export class LogController {
  constructor(private readonly logService: LogService) {}

  @ApiOperation({ summary: "日志分页列表" })
  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: false }))
  async getLogPage(@Query() query: LogQueryDto) {
    return await this.logService.getLogPage(query);
  }
}
