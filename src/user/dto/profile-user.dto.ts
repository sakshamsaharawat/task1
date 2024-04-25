import { IsNotEmpty, IsString } from "class-validator"

export class UserProfileDto {
    @IsNotEmpty()
    @IsString()
    id: string
}