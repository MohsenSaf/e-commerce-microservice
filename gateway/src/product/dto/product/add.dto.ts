import { IsDecimal, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  categoryId: string;

  @IsNotEmpty()
  @IsDecimal()
  price: number;
}
