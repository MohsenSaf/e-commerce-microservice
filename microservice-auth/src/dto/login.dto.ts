import {
  IsEmail,
  IsOptional,
  ValidateIf,
  IsNotEmpty,
  MinLength,
} from "class-validator"

export class LoginDto {

  @IsOptional()
  @IsEmail({}, { message: "Email must be a valid email address" })
  @ValidateIf((o) => !o.username) // email required if username is empty
  email?: string


  @IsOptional()
  @ValidateIf((o) => !o.email) // username required if email is empty
  @IsNotEmpty({ message: "Username cannot be empty if email is not provided" })
  username?: string


  @IsNotEmpty({ message: "Password is required" })
  @MinLength(6, { message: "Password must be at least 6 characters" })
  password: string
}
