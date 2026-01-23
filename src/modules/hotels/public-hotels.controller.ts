import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { HotelsService } from './hotels.service';
import { SearchHotelDto } from './dto/search-hotel.dto';
import { SearchHotelsResponseDto, HotelDetailResponseDto, HotelSearchItemDto } from './dto/hotel-response.dto';

/**
 * Public Hotels Controller
 * Endpoints for guest discovery and browsing (no authentication required)
 */
@ApiTags('Hotels (Public)')
@Controller('hotels')
export class PublicHotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get('featured')
  @ApiOperation({ summary: 'Get featured hotels for home page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of hotels to return (default 10)' })
  @ApiResponse({
    status: 200,
    description: 'Featured hotels retrieved successfully',
    type: [SearchHotelsResponseDto],
  })
  async getFeaturedHotels(
    @Query('limit') limit?: string,
  ): Promise<HotelSearchItemDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.hotelsService.getFeaturedHotels(limitNum);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search available hotels' })
  @ApiQuery({ name: 'city', required: false, description: 'City name to filter' })
  @ApiQuery({ name: 'checkIn', required: false, description: 'Check-in date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'checkOut', required: false, description: 'Check-out date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'adults', required: false, description: 'Number of adults' })
  @ApiQuery({ name: 'rooms', required: false, description: 'Number of rooms' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default 10, max 100)' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['recommended', 'price_asc', 'rating_desc'] })
  @ApiResponse({
    status: 200,
    description: 'Hotels list retrieved successfully',
    type: SearchHotelsResponseDto,
  })
  async searchHotels(
    @Query() query: SearchHotelDto,
  ): Promise<SearchHotelsResponseDto> {
    return this.hotelsService.searchPublicHotels(query);
  }

  @Get(':hotelId')
  @ApiOperation({ summary: 'Get hotel details with available rooms' })
  @ApiQuery({ name: 'checkIn', required: false, description: 'Check-in date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'checkOut', required: false, description: 'Check-out date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'adults', required: false, description: 'Number of adults' })
  @ApiQuery({ name: 'rooms', required: false, description: 'Number of rooms' })
  @ApiResponse({
    status: 200,
    description: 'Hotel details retrieved successfully',
    type: HotelDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Hotel not found',
  })
  async getHotelDetail(
    @Param('hotelId') hotelId: string,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
    @Query('adults') adults?: string,
    @Query('rooms') rooms?: string,
  ): Promise<HotelDetailResponseDto> {
    const result = await this.hotelsService.getPublicHotelDetail(
      hotelId,
      checkIn,
      checkOut,
      adults ? parseInt(adults, 10) : undefined,
      rooms ? parseInt(rooms, 10) : undefined,
    );

    if (!result) {
      throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
    }

    return result;
  }
}
