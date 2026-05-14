import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // Company Settings
  async getCompanySettings(tenantId: string) {
    const settings = await this.prisma.companySettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      throw new NotFoundException('Company settings not found');
    }

    return settings;
  }

  async saveCompanySettings(tenantId: string, data: any) {
    const settings = await this.prisma.companySettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        ...data,
      },
      update: data,
    });

    return {
      message: 'Company settings saved successfully',
      data: settings,
    };
  }
}
