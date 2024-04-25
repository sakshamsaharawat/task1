import { SearchUserDto } from './dto/search-user.dto';
import { SignInUserDto } from './dto/sign-in.input';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { User } from './schema/user.schema';
import { BooleanMessage } from './interface/boolean-message.interface';
import { UserlistDto } from './dto/list-user.dto';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { extname } from 'path';
import { diskStorage } from 'multer';
import * as multer from 'multer';



@Injectable()
export class UserService {
  constructor(@InjectModel(User.name)
  private userModel: mongoose.Model<User>,
    private readonly httpService: HttpService
  ) { }
  async createUser(createUserDto: CreateUserDto): Promise<BooleanMessage> {
    try {
      const existingUser = await this.userModel.findOne({ email: createUserDto.email.toLowerCase() }).exec();
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const newUser = new User();
      newUser.id = uuidv4();
      newUser.firstName = createUserDto.firstName;
      newUser.lastName = createUserDto.lastName;
      newUser.email = createUserDto.email;
      newUser.password = createUserDto.password;
      await new this.userModel(newUser).save()
      return { success: true, message: 'user created successfully.' }
    } catch (error) {
      throw new BadRequestException('something went wrong'), error
    }
  }

  async signIn(signInUserDto: SignInUserDto): Promise<BooleanMessage> {
    const isEmailExist = await this.userModel.findOne({ email: signInUserDto.email.toLowerCase() })
    if (!isEmailExist) {
      throw new NotFoundException('User not found.')
    }
    if (isEmailExist.password !== signInUserDto.password) {
      throw new ForbiddenException('Invalid credentials.')
    }
    return { success: true, message: 'Sign in successfully.' }
  }

  sendPasswordResetEmail(): BooleanMessage {
    return { success: true, message: 'Reset Pasword link sent on your email. ' }

  }

  async search(searchUserDto: SearchUserDto): Promise<User[]> {
    const a = new RegExp(searchUserDto.search, "i");
    const data = await this.userModel.find({
      $or: [
        {
          email: a
        },
        {
          firstName: { $regex: searchUserDto.search, $options: "i" }
        },
        {
          lastName: { $regex: searchUserDto.search, $options: "i" }
        }
      ]
    })
    if (!data.length) {
      throw new NotFoundException('Not found.');
    }
    return data;
  }

  async profile(id: string): Promise<User> {
    const profile = await this.userModel.findOne({ id });
    if (!profile) {
      throw new NotFoundException('User not found.');
    }
    return profile;
  }

  async list(userlistDto: UserlistDto): Promise<{ users: User[], totalCount: number }> {
    const totalCountPromise = this.userModel.countDocuments();
    const usersPromise = this.userModel.find().limit(userlistDto.take).skip(userlistDto.skip);
    const [totalCount, users] = await Promise.all([totalCountPromise, usersPromise]);

    return { users, totalCount };
  }

  async find() {
    const { data } = await firstValueFrom(
      this.httpService.get('https://dummyjson.com/products').pipe(
        catchError((error: AxiosError) => {
          throw 'An error happened!';
        }),
      ),
    );
    return data;
  }

  async uploadFile(file): Promise<string> {
    const fileName = uuidv4() + extname(file.originalname);

    return new Promise<string>((resolve, reject) => {
      const uploadPath = __dirname + '/../uploads/' + fileName;
      const storage = diskStorage({
        destination: (req, file, cb) => {
          cb(null, __dirname + '/../uploads/');
        },
        filename: (req, file, cb) => {
          cb(null, fileName);
        },
      });

      const upload = multer({ storage }).single('file');

      upload(null, null, async (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(uploadPath);
        }
      });
    });
  }
}

