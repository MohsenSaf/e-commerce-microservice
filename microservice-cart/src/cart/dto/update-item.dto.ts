import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class UpdateItemDto {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  quantity: number;
}
