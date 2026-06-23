import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class RestockDto {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
