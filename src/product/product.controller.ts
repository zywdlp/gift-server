import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Permissions } from "@/common/decorators/auth.decorator";
import { Log } from "@/common/decorators/log.decorator";
import { ActionTypeValue } from "@/common/enums/action-type.enum";
import { LogModuleValue } from "@/common/enums/log-module.enum";
import { CreateProductDto } from "./dto/create-product.dto";
import { ProductQueryDto } from "./dto/product-query.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductService } from "./product.service";

@ApiTags("07.商品管理")
@Controller("products")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiOperation({ summary: "商品分页列表" })
  @Get()
  @Permissions("product:list")
  async getPage(@Query() query: ProductQueryDto) {
    return await this.productService.getPage(query.pageNum, query.pageSize, query.keywords);
  }

  @ApiOperation({ summary: "商品详情" })
  @Get(":id")
  @Permissions("product:read")
  async getForm(@Param("id") id: string) {
    return await this.productService.getForm(id);
  }

  @ApiOperation({ summary: "新建商品" })
  @Log(LogModuleValue.PRODUCT, ActionTypeValue.INSERT, "商品管理-新增")
  @Post()
  @Permissions("product:create")
  async create(@Body() dto: CreateProductDto) {
    return await this.productService.create(dto);
  }

  @ApiOperation({ summary: "修改商品" })
  @Log(LogModuleValue.PRODUCT, ActionTypeValue.UPDATE, "商品管理-修改")
  @Put(":id")
  @Permissions("product:update")
  async update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return await this.productService.update(id, dto);
  }

  @ApiOperation({ summary: "删除商品" })
  @Log(LogModuleValue.PRODUCT, ActionTypeValue.DELETE, "商品管理-删除")
  @Delete(":id")
  @Permissions("product:delete")
  async delete(@Param("id") id: string) {
    return await this.productService.delete(id);
  }

  @ApiOperation({ summary: "上传商品图片" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } })
  @Log(LogModuleValue.PRODUCT, ActionTypeValue.UPLOAD, "商品管理-上传图片")
  @Post("images")
  @Permissions("product:create", "product:update")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadImage(@UploadedFile() file: any) {
    if (!file) throw new Error("请选择图片，且大小不超过 5MB");
    return await this.productService.saveImage(file);
  }

  @ApiOperation({ summary: "删除未使用的商品图片" })
  @Log(LogModuleValue.PRODUCT, ActionTypeValue.DELETE, "商品管理-删除图片")
  @Delete("images/file")
  @Permissions("product:create", "product:update")
  async deleteImage(@Query("url") url: string) {
    return await this.productService.deleteImage(url);
  }
}
