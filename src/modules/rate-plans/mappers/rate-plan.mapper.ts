import { UpdateRatePlanDto } from '../dto';

export class RatePlanMapper {
  /**
   * Map UpdateRatePlanDto to Prisma update data
   */
  static mapUpdateDtoToData(dto: UpdateRatePlanDto): Record<string, any> {
    const data: Record<string, any> = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.rateCode !== undefined) data.rateCode = dto.rateCode;
    if (dto.basePrice !== undefined) data.basePrice = dto.basePrice;
    if (dto.minLos !== undefined) data.minLos = dto.minLos;
    if (dto.maxLos !== undefined) data.maxLos = dto.maxLos;
    if (dto.validFrom !== undefined) data.validFrom = new Date(dto.validFrom);
    if (dto.validUntil !== undefined)
      data.validUntil = new Date(dto.validUntil);
    if (dto.cancellationPolicy !== undefined)
      data.cancellationPolicy = dto.cancellationPolicy;
    if (dto.refundablePercent !== undefined)
      data.refundablePercent = dto.refundablePercent;
    if (dto.depositRequired !== undefined)
      data.depositRequired = dto.depositRequired;
    if (dto.depositPercent !== undefined)
      data.depositPercent = dto.depositPercent;
    if (dto.includesBreakfast !== undefined)
      data.includesBreakfast = dto.includesBreakfast;
    if (dto.includesDinner !== undefined)
      data.includesDinner = dto.includesDinner;
    if (dto.includesParking !== undefined)
      data.includesParking = dto.includesParking;
    if (dto.otherInclusions !== undefined)
      data.otherInclusions = dto.otherInclusions;
    if (dto.minGuestCount !== undefined) data.minGuestCount = dto.minGuestCount;
    if (dto.maxGuestCount !== undefined) data.maxGuestCount = dto.maxGuestCount;
    if (dto.modificationAllowed !== undefined)
      data.modificationAllowed = dto.modificationAllowed;
    if (dto.modificationFee !== undefined)
      data.modificationFee = dto.modificationFee;
    if (dto.rateType !== undefined) data.rateType = dto.rateType;
    if (dto.active !== undefined) data.active = dto.active;

    return data;
  }
}
