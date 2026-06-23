import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;
}
