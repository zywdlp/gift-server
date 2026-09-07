import { Body, Controller, Get, Param, Post, Query, Res, SetMetadata, UseGuards } from "@nestjs/common";
import type { Response as ExpressResponse } from "express";
import archiver = require("archiver");
import QRCode = require("qrcode");
import * as XLSX from "xlsx";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Log } from "@/common/decorators/log.decorator";
import { ActionTypeValue } from "@/common/enums/action-type.enum";
import { LogModuleValue } from "@/common/enums/log-module.enum";
import { CardSecretService } from "./card-secret.service";
import { CardSecretQueryDto } from "./dto/card-secret-query.dto";
import { GenerateCardSecretDto } from "./dto/generate-card-secret.dto";
import { GiftCardQueryDto } from "./dto/gift-card-query.dto";
import { BindGiftCardsDto } from "./dto/bind-gift-cards.dto";
import { AdminOnlyGuard } from "@/common/guards/admin-only.guard";

@ApiTags("卡密管理")
@Controller("card-secrets")
@UseGuards(AdminOnlyGuard)
export class CardSecretController {
  constructor(private readonly cardSecretService: CardSecretService) {}

  @Get()
  @ApiOperation({ summary: "卡密批次分页列表" })
  getPage(@Query() query: CardSecretQueryDto) { return this.cardSecretService.getPage(query); }

  @Post("generate")
  @ApiOperation({ summary: "生成卡密" })
  @Log(LogModuleValue.OTHER, ActionTypeValue.INSERT, "卡密管理-生成卡密")
  generate(@Body() dto: GenerateCardSecretDto) { return this.cardSecretService.generate(dto); }

  @Get("cards")
  @ApiOperation({ summary: "礼品卡分页列表" })
  getGiftCardPage(@Query() query: GiftCardQueryDto) { return this.cardSecretService.getGiftCardPage(query); }

  @Post("cards/bind")
  @ApiOperation({ summary: "批量绑定商品" })
  @Log(LogModuleValue.OTHER, ActionTypeValue.UPDATE, "礼品卡管理-绑定商品")
  bindGiftCards(@Body() dto: BindGiftCardsDto) { return this.cardSecretService.bindGiftCards(dto); }

  @Get(":id/cards")
  @ApiOperation({ summary: "批次卡密列表" })
  @SetMetadata("skipResponseLog", true)
  getCards(
    @Param("id") id: string,
    @Query("pageNum") pageNum = 1,
    @Query("pageSize") pageSize = 20,
    @Query("cardNo") cardNo?: string,
  ) {
    return this.cardSecretService.getCards(id, Number(pageNum), Number(pageSize), cardNo);
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
  @ApiOperation({ summary: "导出二维码图片" })
  @Log(LogModuleValue.OTHER, ActionTypeValue.EXPORT, "卡密管理-导出二维码图片")
  @SetMetadata("skipResponseTransform", true)
  async exportQr(@Param("id") id: string, @Res() res: ExpressResponse) {
    const cards = await this.cardSecretService.getCardsForExport(id);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=${encodeURIComponent("二维码图片.zip")}`);
    const zip = archiver("zip", { zlib: { level: 9 } });
    zip.on("error", (error) => res.destroy(error));
    zip.pipe(res);
    const manifestRows: string[][] = [];
    for (const card of cards) {
      const qrUrl = this.cardSecretService.getQrUrl(card);
      const image = await QRCode.toBuffer(qrUrl, {
        type: "png",
        width: 420,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      const fileName = `${card.cardNo}.png`;
      zip.append(image, { name: fileName });
      manifestRows.push([card.cardNo, qrUrl, fileName]);
    }
    zip.append(this.createExcelBuffer("二维码清单", ["卡号", "二维码链接", "图片文件名"], manifestRows), { name: "二维码清单.xlsx" });
    await zip.finalize();
  }

  private writeExcel(res: ExpressResponse, sheetName: string, header: string[], rows: string[][]) {
    const buffer = this.createExcelBuffer(sheetName, header, rows);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${encodeURIComponent(`${sheetName}.xlsx`)}`);
    res.send(buffer);
  }

  private createExcelBuffer(sheetName: string, header: string[], rows: string[][]) {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([header, ...rows]), sheetName);
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }
}
