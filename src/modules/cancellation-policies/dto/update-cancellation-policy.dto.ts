import { PartialType } from '@nestjs/swagger';
import { CreateCancellationPolicyDto } from './create-cancellation-policy.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCancellationPolicyDto extends PartialType(
  CreateCancellationPolicyDto,
) {
  @ApiPropertyOptional({
    example: true,
    description: 'Whether the policy is active',
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
