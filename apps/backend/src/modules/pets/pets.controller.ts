import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { QueryPetsDto } from './dto/query-pets.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

const ALLOWED_IMAGE_MIME = /image\/(jpeg|jpg|png|webp)/;
const ALLOWED_VIDEO_MIME = /video\/(mp4|webm|quicktime|x-msvideo)/;

const petMediaStorage = diskStorage({
  destination: './uploads/pets',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
  },
});

@Controller('pets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Get()
  @Public()
  findAll(@Query() query: QueryPetsDto) {
    return this.petsService.findAll(query);
  }

  @Get('my')
  @Roles('PARTNER' as any)
  findMyPets(@Request() req: any) {
    return this.petsService.findMyPets(req.user.sub);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.petsService.findOne(id);
  }

  @Post()
  @Roles('PARTNER' as any)
  create(@Request() req: any, @Body() dto: CreatePetDto) {
    return this.petsService.create(req.user.sub, dto);
  }

  // ── Images ──────────────────────────────────────────────────────────────────

  @Post(':id/images')
  @Roles('PARTNER' as any)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: petMediaStorage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_IMAGE_MIME.test(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Solo se permiten imágenes JPG, PNG o WebP'), false);
        }
      },
    }),
  )
  uploadImages(
    @Request() req: any,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.petsService.addImages(req.user.sub, id, files);
  }

  @Delete(':id/images/:filename')
  @Roles('PARTNER' as any)
  removeImage(
    @Request() req: any,
    @Param('id') id: string,
    @Param('filename') filename: string,
  ) {
    return this.petsService.removeImage(req.user.sub, id, filename);
  }

  // ── Videos ──────────────────────────────────────────────────────────────────

  @Post(':id/videos')
  @Roles('PARTNER' as any)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: petMediaStorage,
      limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_VIDEO_MIME.test(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Solo se permiten videos MP4, WebM o MOV'), false);
        }
      },
    }),
  )
  uploadVideos(
    @Request() req: any,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.petsService.addVideos(req.user.sub, id, files);
  }

  @Delete(':id/videos/:filename')
  @Roles('PARTNER' as any)
  removeVideo(
    @Request() req: any,
    @Param('id') id: string,
    @Param('filename') filename: string,
  ) {
    return this.petsService.removeVideo(req.user.sub, id, filename);
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────

  @Patch(':id')
  @Roles('PARTNER' as any)
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdatePetDto) {
    return this.petsService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  @Roles('PARTNER' as any)
  @HttpCode(204)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.petsService.remove(req.user.sub, id);
  }
}
