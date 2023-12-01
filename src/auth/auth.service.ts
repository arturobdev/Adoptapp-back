import { ConfirmationTokenService } from './confirmationToken/confirmation-token.service';
import { BadRequestException, HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { UserService } from "src/users/user.service";
import { CreateUserDTO } from "src/users/dto/user.dto";
import { User } from "src/users/entities/user.entity";
import { UserInformation } from "src/users/entities/user-information.entity";
import { DataSource, Repository } from "typeorm";
import { Role } from "src/role/entities/role.entity";
import { RoleService } from "src/role/role.service";
import { LoginDTO } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";
import { JWTPayload } from "./interfaces/payload.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { NodeMailerService } from "src/node-mailer/nodeMailer.service";

@Injectable()
export class AuthService {

    constructor(
        private readonly dataSource: DataSource,
        private readonly userService: UserService,
        private readonly roleService: RoleService,
        private readonly jwtService: JwtService,
        private readonly confirmationTokenService: ConfirmationTokenService,
        @InjectRepository(UserInformation)
        private readonly userInformationRepository: Repository<UserInformation>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) { }

    async register(userDTO: CreateUserDTO): Promise<any> {
        const { email, password, roleId } = userDTO;
        
        try {
            const user: UserInformation = await this.userInformationRepository.findOne({ where: { email: email } })
            
            if (user) {
                throw new BadRequestException(`Email is already in use.`);
            }
            const newRegister: UserInformation = new UserInformation(email.toLowerCase(), password);
            
            if (roleId) {
                const role: Role = await this.roleService.find(roleId);
                newRegister.role = role;
            }

            if (!newRegister) {
                throw new Error('Error adding information')
            }
            
            const transaction = await this.dataSource.transaction(async manager => {
                const newUser: User = await this.userService.addUser(userDTO);
                newRegister.user = newUser;
                await manager.save(UserInformation, newRegister);
        
                const token = await this.confirmationTokenService.createToken(newUser);
                await this.confirmationTokenService.sendConfirmationEmail(email, token.getToken());

                return 'Transaction complete.'
            });
            return transaction;
        }
        catch (error) {
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Error registering user',
                message: error.message,
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async validateUser({ email, password }: LoginDTO): Promise<boolean> {
        const user: UserInformation = await this.userInformationRepository.findOne({ where: { email: email } })
        if (!user) {
            return false;
        }
        return await user.validatePassword(password);
    }

    async generateAccessToken(email: string) {
        const userInfo = await this.userInformationRepository.findOne({ where: { email: email } });
        const user = await this.userRepository.findOne({ where: { id: userInfo.user_id } });

        const payload: JWTPayload = { userId: userInfo.user_id, userEmail: userInfo.email, userName: user.name, userSurname: user.surname, userRole: userInfo.role_id };
        return {
            jwt: this.jwtService.sign(payload),
        };
    }
}