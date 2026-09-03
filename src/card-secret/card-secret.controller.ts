import { Body, Controller, Get, Param, Post, Query, Res, SetMetadata } from "@nestjs/common";
import type { Response as ExpressResponse } from "express";
import * as XLSX from "xlsx";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Log } from "@/common/decorators/log.decorator";
import { ActionTypeValue } from "@/common/enums/action-type.enum";
import { LogModuleValue } from "@/common/enums/log-module.enum";
import { CardSecretService } from "./card-secret.service";
import { CardSecretQueryDto } from "./dto/card-secret-query.dto";
import { GenerateCardSecretDto } from "./dto/generate-card-secret.dto";

@ApiTags("卡密管理")
@Controller("card-secrets")
export class CardSecretController {
  constructor(private readonly cardSecretService: CardSecretService) {}

  @Get()
  @ApiOperation({ summary: "卡密批次分页列表" })
  getPage(@Query() query: CardSecretQueryDto) { return this.cardSecretService.getPage(query); }

  @Post("generate")
  @ApiOperation({ summary: "生成卡密" })
  @Log(LogModuleValue.OTHER, ActionTypeValue.INSERT, "卡密管理-生成卡密")
  generate(@Body() dto: GenerateCardSecretDto) { return this.cardSecretService.generate(dto); }

  @Get(":id/cards")
  @ApiOperation({ summary: "批次卡密列表" })
  @SetMetadata("skipResponseLog", true)
  getCards(@Param("id") id: string, @Query("pageNum") pageNum = 1, @Query("pageSize") pageSize = 20) {
    return this.cardSecretService.getCards(id, Number(pageNum), Number(pageSize));
  }

  @Post(":id/export-printing")
  @ApiOperation({ summary: "导出制卡文件" })
  @Log(LogModuleValue.OTHER, ActionTypeValue.EXPORT, "卡密管理-导出制卡文件")
  @SetMetadata("skipResponseTransform", true)
  async exportPrinting(@Param("id") id: string, @Res() res: ExpressResponse) {
    const cards = await this.cardSecretService.getCardsForExport(id);
    this.writeExcel(res, "制卡文件", ["卡号", "PIN", "二维码Token"], cards.map((card) => [card.cardNo, this.cardSecretService.getPin(card), this.cardSecretService.getQrToken(card)]));
  }

  @Post(":id/export-qr")
  @ApiOperation({ summary: "导出二维码数据" })
  @Log(LogModuleValue.OTHER, ActionTypeValue.EXPORT, "卡密管理-导出二维码")
  @SetMetadata("skipResponseTransform", true)
  async exportQr(@Param("id") id: string, @Res() res: ExpressResponse) {
    const cards = await this.cardSecretService.getCardsForExport(id);
    this.writeExcel(res, "二维码数据", ["卡号", "二维码Token"], cards.map((card) => [card.cardNo, this.cardSecretService.getQrToken(card)]));
  }

  private writeExcel(res: ExpressResponse, sheetName: string, header: string[], rows: string[][]) {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([header, ...rows]), sheetName);
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${encodeURIComponent(`${sheetName}.xlsx`)}`);
    res.send(buffer);
  }
}
