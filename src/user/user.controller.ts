import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ValidationPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SignInUserDto } from './dto/sign-in.input';
import { SearchUserDto } from './dto/search-user.dto';
import { BooleanMessage } from './interface/boolean-message.interface';
import { User } from './schema/user.schema';
import { UserlistDto } from './dto/list-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';

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
  profile(@Param('id') id: string): Promise<User> {
    return this.userService.profile(id);
  }

  @Post('list')
  list(@Body() userlistDto: UserlistDto): Promise<{ users: User[], totalCount: number }> {
    return this.userService.list(userlistDto);
  }
  @Get('dummy')
  find() {
    return this.userService.find();
  }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file) {
    // Handle file here, e.g., save to database or return response
    return { filename: file.filename };
  }
}
