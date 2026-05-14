import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  findMe(@GetTenantId() tenantId: string) {
    return this.tenantsService.findOne(tenantId);
  }

  @Patch('me')
  updateMe(@GetTenantId() tenantId: string, @Body() data: any) {
    return this.tenantsService.update(tenantId, data);
  }
}

