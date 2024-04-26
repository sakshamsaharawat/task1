import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SignInUserDto } from './dto/sign-in.input';
import { SearchUserDto } from './dto/search-user.dto';
import { BooleanMessage } from './interface/boolean-message.interface';
import { User } from './schema/user.schema';
import { UserlistDto } from './dto/list-user.dto';
import { DecodeInput } from './dto/decode.inputs.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<BooleanMessage> {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  findAll(@Body() signInUserDto: SignInUserDto): Promise<BooleanMessage> {
    return this.userService.signIn(signInUserDto);
  }

  @Get('reset/password/:id')
  sendPasswordResetEmail(): BooleanMessage {
    return this.userService.sendPasswordResetEmail();
  }

  @Post('search')
  search(@Body() searchUserDto: SearchUserDto): Promise<User[]> {
    return this.userService.search(searchUserDto);
  }

  @Post('profile/:id')
  profile(@Param('id') id: string) {
    return this.userService.profile(id);
  }

  @Post('list')
  list(@Body() userlistDto: UserlistDto): Promise<{ users: User[], totalCount: number }> {
    return this.userService.list(userlistDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.userService.uploadFile(file)
  }

  @Post('decode')
  decode(@Body() decodeInput: DecodeInput) {
    return this.userService.decode(decodeInput);
  }

}
