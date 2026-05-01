import { IsEmail, IsString, MinLength, Matches, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password!: string;

  @ApiProperty({ required: false, description: 'Extended refresh expiry when true' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  remember?: boolean;
}
