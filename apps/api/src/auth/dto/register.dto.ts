import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Min 8 chars, upper, lower, digit, special' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
  })
  password!: string;

  @ApiProperty({ required: false })
  @IsString()
  displayName?: string;
}
