import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export enum NotificationType {
  ORDER_PLACED      = 'ORDER_PLACED',
  ORDER_CONFIRMED   = 'ORDER_CONFIRMED',
  ORDER_CANCELLED   = 'ORDER_CANCELLED',
  ORDER_SHIPPED     = 'ORDER_SHIPPED',
  ORDER_DELIVERED   = 'ORDER_DELIVERED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_FAILED    = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED  = 'PAYMENT_REFUNDED',
}

export class SendNotificationDto {
  @IsNotEmpty() @IsString()
  userId: string;

  @IsNotEmpty() @IsEnum(NotificationType)
  type: NotificationType;

  @IsNotEmpty() @IsString()
  title: string;

  @IsNotEmpty() @IsString()
  message: string;

  @IsOptional() @IsObject()
  metadata?: Record<string, any>;
}
