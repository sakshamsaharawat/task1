import { IsNumber, IsPositive, Min } from "class-validator"

export class UserlistDto {
    @IsNumber()
    @IsPositive()
    take: number

    @IsNumber()
    @Min(1)
    skip: number
}