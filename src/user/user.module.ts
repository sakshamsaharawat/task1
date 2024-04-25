import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { HttpModule } from '@nestjs/axios';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [HttpModule, MulterModule.register({
    dest: "./uploads"
  }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule { }
