import { Body, Controller, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('partners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get('me')
  @Roles('PARTNER' as any)
  getMyProfile(@Request() req: any) {
    return this.partnersService.getMyProfile(req.user.sub);
  }

  @Get(':id')
  @Public()
  getPublicProfile(@Param('id') id: string) {
    return this.partnersService.getPublicProfile(id);
  }

  @Patch('me')
  @Roles('PARTNER' as any)
  updateMyProfile(@Request() req: any, @Body() dto: UpdatePartnerDto) {
    return this.partnersService.updateMyProfile(req.user.sub, dto);
  }
}
