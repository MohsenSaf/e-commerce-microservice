import { IsNotEmpty } from 'class-validator';

export class LogoutDto {
  @IsNotEmpty({ message: 'userId is required' })
  userId: string;
}
