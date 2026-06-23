import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AdjustInventoryDto {
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
