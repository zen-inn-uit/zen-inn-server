// src/modules/assets/dto/create-presign.dto.ts
import { IsIn, IsString, Matches } from 'class-validator';
import { ASSET_SCOPES } from '../asset-scope.type';
import type { AssetScope } from '../asset-scope.type';
export class CreatePresignDto {
  @IsString()
  @Matches(/^[\w.\- ]+$/i, {
    message: 'fileName only allows letters, digits, dot, dash and space.',
  })
  fileName: string;

  @IsString()
  @Matches(/^[-\w]+\/[-\w.+]+$/i, { message: 'Invalid contentType' })
  contentType: string;

  @IsString()
  @IsIn(ASSET_SCOPES)
  scope: AssetScope;
}
