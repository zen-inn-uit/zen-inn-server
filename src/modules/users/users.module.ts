import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserProfileController } from './user-profile.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [UserProfileController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
