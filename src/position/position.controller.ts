// position/position.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  CreatePositionSchema,
  ListPositionsQuerySchema,
  UpdatePositionSchema,
} from './position.schema';
import { PositionService } from './position.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('positions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Post()
  @Roles('Administrator')
  @UsePipes(new ZodValidationPipe(CreatePositionSchema))
  async create(@Body() body: unknown) {
    const parsed = CreatePositionSchema.parse(body);
    const created = await this.positionService.create(parsed);
    return created;
  }

  @Get()
  @Roles('Administrator', 'User')
  findAll(@Query() query: unknown) {
    const parsed = ListPositionsQuerySchema.parse(query);
    return this.positionService.findAll(parsed);
  }

  @Get(':id')
  @Roles('Administrator', 'User')
  findOne(@Param('id') id: string) {
    return this.positionService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrator')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const parsed = UpdatePositionSchema.parse(body);
    const updated = await this.positionService.update(id, parsed);
    return updated;
  }

  @Delete(':id')
  @Roles('Administrator')
  remove(@Param('id') id: string) {
    return this.positionService.remove(id);
  }
}
