import { IsDecimal, IsOptional, IsString } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  categoryId: string;

  @IsOptional()
  @IsDecimal()
  price: number;
}
