import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { basename, extname, isAbsolute, join, relative, resolve } from "path";
import { DeepPartial, Repository } from "typeorm";
import { BusinessException } from "@/common/exceptions/business.exception";
import { getUploadRoot, UPLOAD_URL_PREFIX } from "@/common/utils/upload-path.util";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Product } from "./entities/product.entity";
import { GiftCard } from "@/card-secret/entities/gift-card.entity";

interface UploadedImage {
  mimetype: string;
  buffer: Buffer;
}

const imageExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(GiftCard)
    private readonly giftCardRepository: Repository<GiftCard>
  ) {}

  async getPage(pageNum = 1, pageSize = 10, keywords?: string) {
    const query = this.productRepository
      .createQueryBuilder("product")
      .where("product.isDeleted = :isDeleted", { isDeleted: 0 });
    if (keywords) {
      query.andWhere("(product.name LIKE :keywords OR product.shortName LIKE :keywords)", {
        keywords: `%${keywords.trim()}%`,
      });
    }
    const [data, total] = await query
      .orderBy("product.createTime", "DESC")
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    const productIds = data.map((product) => product.id);
    const boundProductIds = productIds.length
      ? new Set(
          (await this.giftCardRepository
            .createQueryBuilder("giftCard")
            .select("DISTINCT giftCard.productId", "productId")
            .where("giftCard.productId IN (:...productIds)", { productIds })
            .andWhere("giftCard.isDeleted = 0")
            .getRawMany())
            .map((row) => String(row.productId))
        )
      : new Set<string>();
    return {
      data: data.map((product) => ({ ...product, hasBoundCards: boundProductIds.has(String(product.id)) })),
      page: { pageNum, pageSize, total },
    };
  }

  async getForm(id: string) {
    return await this.findActiveProduct(id);
  }

  async create(dto: CreateProductDto) {
    const product = this.productRepository.create(this.normalize(dto) as DeepPartial<Product>);
    this.assertCoverImage(product);
    return await this.productRepository.save(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findActiveProduct(id);
    const hasBoundCards = await this.giftCardRepository.exists({ where: { productId: id, isDeleted: 0 } });
    if (hasBoundCards) throw new BusinessException("该商品已绑定礼品卡，不能编辑");
    const previousImageUrls = this.getImageUrls(product);
    Object.assign(product, this.normalize(dto));
    this.assertCoverImage(product);
    await this.productRepository.save(product);
    await this.removeUnusedImages(
      previousImageUrls.filter((url) => !this.getImageUrls(product).includes(url))
    );
    return true;
  }

  async delete(id: string) {
    const product = await this.findActiveProduct(id);
    const hasBoundCards = await this.giftCardRepository.exists({ where: { productId: id, isDeleted: 0 } });
    if (hasBoundCards) throw new BusinessException("该商品已绑定礼品卡，不能删除");
    const imageUrls = this.getImageUrls(product);
    product.isDeleted = 1;
    await this.productRepository.save(product);
    await this.removeUnusedImages(imageUrls);
    return true;
  }

  async saveImage(file: UploadedImage) {
    const extension = imageExtensions[file.mimetype];
    if (!extension) throw new BusinessException("仅支持 JPG、PNG、WebP、GIF 图片");

    const datePath = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
    const targetDirectory = join(getUploadRoot(), "products", datePath);
    await mkdir(targetDirectory, { recursive: true });
    const targetPath = join(targetDirectory, `${randomUUID()}${extension}`);
    await writeFile(targetPath, file.buffer);
    const pathFromRoot = relative(getUploadRoot(), targetPath).replace(/\\/g, "/");
    return { url: `${UPLOAD_URL_PREFIX}/${pathFromRoot}` };
  }

  async deleteImage(url: string) {
    if (await this.isImageReferenced(url)) {
      throw new BusinessException("图片仍被商品使用，不能单独删除");
    }
    await this.removeImageFile(url);
    return true;
  }

  private async findActiveProduct(id: string) {
    const product = await this.productRepository.findOne({ where: { id, isDeleted: 0 } });
    if (!product) throw new BusinessException("商品不存在或已删除");
    return product;
  }

  private assertCoverImage(product: Product) {
    if (!product.coverImage) throw new BusinessException("请上传商品主图");
  }

  private normalize(dto: CreateProductDto | UpdateProductDto) {
    const result: Record<string, unknown> = { ...dto };
    for (const key of ["shortName", "coverImage", "description", "deliveryScope", "afterSales"]) {
      if (result[key] === "") result[key] = null;
    }
    if (result.referenceValue === "") result.referenceValue = null;
    return result;
  }

  private getImageUrls(product: Product) {
    return [...new Set([product.coverImage, ...(product.detailImages || [])].filter(Boolean))] as string[];
  }

  /**
   * 商品数据已经成功保存后，尽力删除已不再被任何有效商品引用的本地图片。
   * 文件系统无法与 MySQL 事务原子提交，因此文件清理失败只记录日志，不回滚已成功的商品操作。
   */
  private async removeUnusedImages(urls: string[]) {
    await Promise.all(
      urls.map(async (url) => {
        try {
          if (!(await this.isImageReferenced(url))) await this.removeImageFile(url);
        } catch (error) {
          this.logger.warn(`清理商品图片失败: ${url}`, error instanceof Error ? error.stack : error);
        }
      })
    );
  }

  private async isImageReferenced(url: string) {
    return await this.productRepository
      .createQueryBuilder("product")
      .where("product.isDeleted = :isDeleted", { isDeleted: 0 })
      .andWhere(
        "(product.coverImage = :url OR JSON_SEARCH(product.detailImages, 'one', :url) IS NOT NULL)",
        { url }
      )
      .getExists();
  }

  private async removeImageFile(url: string) {
    const safePath = this.resolveImagePath(url);
    try {
      await unlink(safePath);
    } catch (error: any) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  private resolveImagePath(url: string) {
    if (!url?.startsWith(`${UPLOAD_URL_PREFIX}/products/`)) {
      throw new BusinessException("只能删除商品上传的图片");
    }
    const targetPath = resolve(getUploadRoot(), url.slice(`${UPLOAD_URL_PREFIX}/`.length));
    const productRoot = resolve(getUploadRoot(), "products");
    const pathWithinProductRoot = relative(productRoot, targetPath);
    if (
      pathWithinProductRoot.startsWith("..") ||
      isAbsolute(pathWithinProductRoot) ||
      !basename(targetPath) ||
      !extname(targetPath)
    ) {
      throw new BusinessException("图片地址不合法");
    }
    return targetPath;
  }
}
