import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SysRoleMenu } from "./entities/sys-role-menu.entity";
import { SysMenu } from "../menu/entities/sys-menu.entity";

/**
 * 角色权限缓存服务
 *
 * 负责从 MySQL 查询角色与权限标识的映射关系。
 */
@Injectable()
export class RolePermService {
  constructor(
    @InjectRepository(SysRoleMenu)
    private roleMenuRepository: Repository<SysRoleMenu>,
    @InjectRepository(SysMenu)
    private menuRepository: Repository<SysMenu>
  ) {}

  /**
   * 获取角色权限集合。
   *
   * @param roleCodes 角色编码集合
   * @returns 权限标识集合
   */
  async getPermsByRoleCodes(roleCodes: string[]): Promise<string[]> {
    if (!roleCodes || roleCodes.length === 0) {
      return [];
    }

    const perms = await Promise.all([...new Set(roleCodes)].map((code) => this.getRolePermsByRoleCodeFromDB(code)));
    return Array.from(new Set(perms.flat()));
  }

  /**
   * 从数据库获取单个角色的权限
   *
   * @param roleCode 角色编码
   * @returns 权限标识数组
   */
  private async getRolePermsByRoleCodeFromDB(roleCode: string): Promise<string[]> {
    const results = await this.roleMenuRepository
      .createQueryBuilder("rm")
      .innerJoin("rm.role", "role")
      .innerJoin("rm.menu", "menu")
      .where("role.code = :roleCode", { roleCode })
      .andWhere("role.isDeleted = :isDeleted", { isDeleted: 0 })
      .andWhere("role.status = :status", { status: 1 })
      .andWhere("menu.type = :menuType", { menuType: "B" })
      .andWhere("menu.perm IS NOT NULL")
      .select("menu.perm", "perm")
      .getRawMany();

    return results.map((r) => r.perm);
  }

  /**
   * 获取所有权限标识（超级管理员使用）
   *
   * @returns 所有按钮权限标识
   */
  async getAllPerms(): Promise<string[]> {
    const menus = await this.menuRepository.find({
      where: { type: "B" },
      select: ["perm"],
    });
    return menus.map((m) => m.perm).filter((p): p is string => !!p);
  }
}
