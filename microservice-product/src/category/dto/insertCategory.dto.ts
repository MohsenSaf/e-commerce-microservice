import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class InsertCategoryDto {

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  productIds: string[];
}
