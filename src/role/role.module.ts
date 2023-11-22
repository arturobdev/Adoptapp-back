import { TypeOrmModule } from "@nestjs/typeorm";
import { Role } from "./entities/role.entity";
import { RoleController } from "./role.controller";
import { RoleService } from "./role.service";
import { Module } from "@nestjs/common";

@Module({
    imports : [TypeOrmModule.forFeature([Role])],
    controllers : [RoleController],
    providers : [RoleService]
})
export class RoleModule{}