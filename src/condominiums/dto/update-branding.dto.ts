import { IsString, IsOptional, IsEnum, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BrandingColorsDto {
  @IsOptional() @IsString() primary?: string;
  @IsOptional() @IsString() primaryForeground?: string;
  @IsOptional() @IsString() secondary?: string;
  @IsOptional() @IsString() accent?: string;
  @IsOptional() @IsString() background?: string;
  @IsOptional() @IsString() foreground?: string;
  @IsOptional() @IsString() sidebarBg?: string;
  @IsOptional() @IsString() sidebarFg?: string;
  @IsOptional() @IsString() darkPrimary?: string | null;
  @IsOptional() @IsString() darkBackground?: string | null;
  @IsOptional() @IsString() darkSidebarBg?: string | null;
}

class BrandingFontDto {
  @IsOptional() @IsString() family?: string;
  @IsOptional() @IsArray() weights?: number[];
}

export class UpdateBrandingDto {
  @IsOptional() @IsString() logoUrl?: string | null;
  @IsOptional() @IsString() logoMarkUrl?: string | null;
  @IsOptional() @IsString() faviconUrl?: string | null;
  @IsOptional() @IsString() appName?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BrandingColorsDto)
  colors?: Partial<BrandingColorsDto>;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BrandingFontDto)
  font?: Partial<BrandingFontDto>;

  @IsOptional()
  @IsEnum(['none', 'sm', 'md', 'lg', 'full'])
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';

  @IsOptional() @IsString() welcomeMessage?: string | null;
  @IsOptional() @IsString() supportEmail?: string | null;
  @IsOptional() @IsString() supportPhone?: string | null;
}
