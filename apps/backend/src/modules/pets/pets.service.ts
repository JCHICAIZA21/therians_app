import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { QueryPetsDto } from './dto/query-pets.dto';

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryPetsDto) {
    const where: Prisma.PetWhereInput = {
      deletedAt: null,
      status: 'AVAILABLE',
      ...(query.species && { species: query.species as any }),
      ...(query.city && { city: { contains: query.city, mode: 'insensitive' } }),
      ...(query.size && { size: query.size as any }),
      ...(query.cursor && { createdAt: { lt: new Date(query.cursor) } }),
    };

    return this.prisma.pet.findMany({
      where,
      take: query.limit ?? 20,
      orderBy: { createdAt: 'desc' },
      include: {
        partner: {
          select: {
            id: true,
            legalName: true,
            type: true,
            phone: true,
            email: true,
            city: true,
            verificationStatus: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const pet = await this.prisma.pet.findFirst({
      where: { id, deletedAt: null },
      include: {
        partner: {
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
        },
      },
    });
    if (!pet) throw new NotFoundException('Animal no encontrado');
    return pet;
  }

  async findMyPets(userId: string) {
    const partnerUser = await this.prisma.partnerUser.findFirst({
      where: { userId },
    });
    if (!partnerUser) throw new ForbiddenException('No tienes partner asociado');

    return this.prisma.pet.findMany({
      where: { partnerId: partnerUser.partnerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreatePetDto) {
    const partnerUser = await this.prisma.partnerUser.findFirst({
      where: { userId },
    });
    if (!partnerUser) throw new ForbiddenException('No tienes partner asociado');

    return this.prisma.pet.create({
      data: {
        partnerId: partnerUser.partnerId,
        name: dto.name,
        species: dto.species as any,
        breed: dto.breed,
        ageMonths: dto.ageMonths,
        size: dto.size as any,
        healthNotes: dto.healthNotes,
        city: dto.city,
      },
    });
  }

  async addImages(userId: string, petId: string, files: Express.Multer.File[]) {
    await this.assertOwnership(userId, petId);
    const urls = files.map((f) => `/uploads/pets/${f.filename}`);
    return this.prisma.pet.update({
      where: { id: petId },
      data: { images: { push: urls } },
    });
  }

  async removeImage(userId: string, petId: string, filename: string) {
    await this.assertOwnership(userId, petId);
    const pet = await this.prisma.pet.findFirst({ where: { id: petId, deletedAt: null } });
    if (!pet) throw new NotFoundException('Animal no encontrado');

    const filePath = join(process.cwd(), 'uploads', 'pets', filename);
    if (existsSync(filePath)) unlinkSync(filePath);

    const images = pet.images.filter((url) => !url.endsWith(`/${filename}`));
    return this.prisma.pet.update({ where: { id: petId }, data: { images } });
  }

  async addVideos(userId: string, petId: string, files: Express.Multer.File[]) {
    await this.assertOwnership(userId, petId);
    const urls = files.map((f) => `/uploads/pets/${f.filename}`);
    return this.prisma.pet.update({
      where: { id: petId },
      data: { videos: { push: urls } },
    });
  }

  async removeVideo(userId: string, petId: string, filename: string) {
    await this.assertOwnership(userId, petId);
    const pet = await this.prisma.pet.findFirst({ where: { id: petId, deletedAt: null } });
    if (!pet) throw new NotFoundException('Animal no encontrado');

    const filePath = join(process.cwd(), 'uploads', 'pets', filename);
    if (existsSync(filePath)) unlinkSync(filePath);

    const videos = pet.videos.filter((url) => !url.endsWith(`/${filename}`));
    return this.prisma.pet.update({ where: { id: petId }, data: { videos } });
  }

  async update(userId: string, petId: string, dto: UpdatePetDto) {
    await this.assertOwnership(userId, petId);
    return this.prisma.pet.update({
      where: { id: petId },
      data: dto as any,
    });
  }

  async remove(userId: string, petId: string) {
    await this.assertOwnership(userId, petId);
    await this.prisma.pet.update({
      where: { id: petId },
      data: { deletedAt: new Date() },
    });
  }

  private async assertOwnership(userId: string, petId: string) {
    const partnerUser = await this.prisma.partnerUser.findFirst({
      where: { userId },
    });
    if (!partnerUser) throw new ForbiddenException();

    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, partnerId: partnerUser.partnerId, deletedAt: null },
    });
    if (!pet) throw new NotFoundException('Animal no encontrado');
  }
}
