import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePartnerDto } from './dto/update-partner.dto';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicProfile(partnerId: string) {
    const partner = await this.prisma.partner.findFirst({
      where: { id: partnerId, deletedAt: null },
      select: {
        id: true,
        legalName: true,
        type: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        website: true,
        description: true,
        verificationStatus: true,
      },
    });
    if (!partner) throw new NotFoundException('Veterinaria no encontrada');
    return partner;
  }

  async getMyProfile(userId: string) {
    const partnerUser = await this.prisma.partnerUser.findFirst({
      where: { userId },
      include: { partner: true },
    });
    if (!partnerUser) throw new NotFoundException('No tienes perfil de empresa');
    return partnerUser.partner;
  }

  async updateMyProfile(userId: string, dto: UpdatePartnerDto) {
    const partnerUser = await this.prisma.partnerUser.findFirst({
      where: { userId },
    });
    if (!partnerUser) throw new ForbiddenException();
    return this.prisma.partner.update({
      where: { id: partnerUser.partnerId },
      data: dto,
    });
  }
}
