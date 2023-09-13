import { Module } from '@nestjs/common';
import { PetsModule } from './pets/pets.module';
import { UsersModule } from './users/users.module';
import { ComplaintModule } from './complaint/complaint.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CityModule } from './city/city.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      "type": "mysql",
      "host": "localhost",
      "port": 3306,
      "username": "root",
      "password": "adoptapp",
      "database": "adoptapp_db",
      "entities": [__dirname + "/**/**/**.entity{.ts,.js}"],
      "synchronize": true,
    }),
    PetsModule, UsersModule, ComplaintModule, CityModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
