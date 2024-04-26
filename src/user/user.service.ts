import { GetProfileResponse } from './decode/decode';
import { SearchUserDto } from './dto/search-user.dto';
import { SignInUserDto } from './dto/sign-in.input';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UploadedFile } from '@nestjs/common';
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
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { Readable } from 'stream';
import { DecodeInput } from './dto/decode.inputs.dto';
import { DecodeType } from './enum/decode.enum';
import * as crypto from 'crypto';


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
    console.log(searchUserDto)
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

  async profile(id: string) {
    const profile = await this.userModel.findOne({ id }).lean().exec();
    if (!profile) {
      throw new NotFoundException('User not found.');
    }
    return GetProfileResponse.decode(profile);
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
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!file || !file.buffer) {
        throw new Error("Uploaded file or its buffer is undefined.");
      }
      const { originalname } = file;
      const uniqueName = "test";
      console.log("File buffer:", file.buffer);
      const createReadStream = Readable.from(file.buffer);

      if (!existsSync("./uploads")) {
        mkdirSync("./uploads", { recursive: true });
      }

      let newName: string = `${uniqueName}${extname(originalname)}`;
      console.log("New file name:", newName);

      return new Promise((resolve, reject) => {
        createReadStream
          .pipe(createWriteStream("./uploads/" + newName))
          .on('finish', () => resolve({ fileName: newName }))
          .on('error', (err) => {
            console.error("Error during file stream piping:", err);
            reject(err);
          });
      });
    } catch (error) {
      console.error("Error during file upload:", error);
      throw new Error("Failed to upload file. Please try again."); // Improved error response
    }
  }

  async decode(decodeInput: DecodeInput) {
    if (decodeInput.type === DecodeType.ENCRYPT) {
      const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
      const iv = Buffer.from(process.env.ENCRYPTION_IV_KEY, 'base64');

      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(decodeInput.value, 'utf-8', 'base64');
      encrypted += cipher.final('base64');

      return { value: encrypted };
    }
    if (decodeInput.type === DecodeType.DECRYPT) {
      const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
      const iv = Buffer.from(process.env.ENCRYPTION_IV_KEY, 'base64');

      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(decodeInput.value, 'base64', 'utf-8');
      decrypted += decipher.final('utf-8');

      return { value: decrypted };
    }
  }

}

