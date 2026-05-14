import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetTenantId } from '../../common/decorators/get-tenant.decorator';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Company Settings
  @Get('company')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Get company settings' })
  @ApiResponse({ status: 200, description: 'Company settings retrieved successfully' })
  getCompanySettings(@GetTenantId() tenantId: string) {
    return this.settingsService.getCompanySettings(tenantId);
  }

  @Post('company')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Create or update company settings' })
  @ApiResponse({ status: 200, description: 'Company settings saved successfully' })
  saveCompanySettings(@GetTenantId() tenantId: string, @Body() data: any) {
    return this.settingsService.saveCompanySettings(tenantId, data);
  }
}
