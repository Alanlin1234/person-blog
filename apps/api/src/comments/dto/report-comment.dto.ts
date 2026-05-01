import { IsString, MaxLength, IsOptional } from 'class-validator';

export class ReportCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
