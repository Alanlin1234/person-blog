import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReauthDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  password!: string;
}
