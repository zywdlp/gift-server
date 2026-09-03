import { Body, Controller, Get, Param, Post, Query, Res, SetMetadata } from "@nestjs/common";
import type { Response as ExpressResponse } from "express";
import * as XLSX from "xlsx";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Log } from "@/common/decorators/log.decorator";
import { ActionTypeValue } from "@/common/enums/action-type.enum";
import { LogModuleValue } from "@/common/enums/log-module.enum";
import { CardBatchService } from "./card-batch.service";
import { CardBatchQueryDto } from "./dto/card-batch-query.dto";
import { GenerateCardBatchDto } from "./dto/generate-card-batch.dto";

@ApiTags("卡密管理")
@Controller("card-batches")
export class CardBatchController {
  constructor(private readonly cardBatchService: CardBatchService) {}

  @Get()
  @ApiOperation({ summary: "卡密批次分页列表" })
  getPage(@Query() query: CardBatchQueryDto) { return this.cardBatchService.getPage(query); }

  @Post("generate")
  @ApiOperation({ summary: "生成卡密" })
  @Log(LogModuleValue.OTHER, ActionTypeValue.INSERT, "卡密管理-生成卡密")
  generate(@Body() dto: GenerateCardBatchDto) { return this.cardBatchService.generate(dto); }

  @Get(":id/cards")
  @ApiOperation({ summary: "批次卡密列表" })
  @SetMetadata("skipResponseLog", true)
  getCards(@Param("id") id: string, @Query("pageNum") pageNum = 1, @Query("pageSize") pageSize = 20) {
    return this.cardBatchService.getCards(id, Number(pageNum), Number(pageSize));
  }

  @Post(":id/export-printing")
  @ApiOperation({ summary: "导出制卡文件" })
  @Log(LogModuleValue.OTHER, ActionTypeValue.EXPORT, "卡密管理-导出制卡文件")
  @SetMetadata("skipResponseTransform", true)
  async exportPrinting(@Param("id") id: string, @Res() res: ExpressResponse) {
    const cards = await this.cardBatchService.getCardsForExport(id);
    this.writeExcel(res, "制卡文件", ["卡号", "PIN", "二维码Token"], cards.map((card) => [card.cardNo, this.cardBatchService.getPin(card), this.cardBatchService.getQrToken(card)]));
  }

  @Post(":id/export-qr")
  @ApiOperation({ summary: "导出二维码数据" })
  @Log(LogModuleValue.OTHER, ActionTypeValue.EXPORT, "卡密管理-导出二维码")
  @SetMetadata("skipResponseTransform", true)
  async exportQr(@Param("id") id: string, @Res() res: ExpressResponse) {
    const cards = await this.cardBatchService.getCardsForExport(id);
    this.writeExcel(res, "二维码数据", ["卡号", "二维码Token"], cards.map((card) => [card.cardNo, this.cardBatchService.getQrToken(card)]));
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
