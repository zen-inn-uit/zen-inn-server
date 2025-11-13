import { IsUrl, IsString, MaxLength } from 'class-validator';

export class CreateKycDocDto {
  @IsString()
  @MaxLength(50)
  kind: string; 

  @IsUrl({ require_tld: false }) 
  url: string;
}
