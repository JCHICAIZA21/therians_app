import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ReplyMessageDto } from './dto/reply-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(201)
  send(@Request() req: any, @Body() dto: SendMessageDto) {
    return this.messagesService.send(req.user.sub, dto);
  }

  @Get('inbox')
  getUserInbox(@Request() req: any) {
    return this.messagesService.getUserInbox(req.user.sub);
  }

  @Get('conversation/:partnerId')
  getConversation(@Request() req: any, @Param('partnerId') partnerId: string) {
    return this.messagesService.getConversation(req.user.sub, partnerId);
  }

  @Get('partner-inbox')
  @Roles('PARTNER' as any)
  getPartnerInbox(@Request() req: any) {
    return this.messagesService.getPartnerInbox(req.user.sub);
  }

  @Get('partner-thread/:userId')
  @Roles('PARTNER' as any)
  getPartnerThread(@Request() req: any, @Param('userId') userId: string) {
    return this.messagesService.getPartnerThread(req.user.sub, userId);
  }

  @Post('partner-reply')
  @HttpCode(201)
  @Roles('PARTNER' as any)
  reply(@Request() req: any, @Body() dto: ReplyMessageDto) {
    return this.messagesService.reply(req.user.sub, dto);
  }

  @Patch(':id/read')
  @HttpCode(200)
  markRead(@Request() req: any, @Param('id') id: string) {
    return this.messagesService.markRead(req.user.sub, id);
  }
}
