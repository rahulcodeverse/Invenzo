import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });

    // Middleware to automatically filter by tenantId
    this.$use(async (params, next) => {
      // Get tenantId from context (will be set by guard)
      const tenantId = (params as any).tenantId;

      if (tenantId && this.shouldFilterByTenant(params.model)) {
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.action = 'findFirst';
          params.args.where = { ...params.args.where, tenantId };
        }

        if (params.action === 'findMany') {
          if (!params.args) params.args = {};
          if (!params.args.where) params.args.where = {};
          params.args.where = { ...params.args.where, tenantId };
        }

        if (params.action === 'update') {
          params.action = 'updateMany';
          params.args.where = { ...params.args.where, tenantId };
        }

        if (params.action === 'updateMany') {
          if (params.args.where) {
            params.args.where = { ...params.args.where, tenantId };
          } else {
            params.args.where = { tenantId };
          }
        }

        if (params.action === 'delete') {
          params.action = 'deleteMany';
          params.args.where = { ...params.args.where, tenantId };
        }

        if (params.action === 'deleteMany') {
          if (params.args.where) {
            params.args.where = { ...params.args.where, tenantId };
          } else {
            params.args.where = { tenantId };
          }
        }

        if (params.action === 'create') {
          if (!params.args.data) params.args.data = {};
          params.args.data = { ...params.args.data, tenantId };
        }

        if (params.action === 'createMany') {
          if (params.args.data) {
            if (Array.isArray(params.args.data)) {
              params.args.data = params.args.data.map((item: any) => ({
                ...item,
                tenantId,
              }));
            } else {
              params.args.data = { ...params.args.data, tenantId };
            }
          }
        }
      }

      return next(params);
    });
  }

  private shouldFilterByTenant(model: string | undefined): boolean {
    // Models that should NOT be filtered by tenant
    const excludedModels = ['Tenant', 'User', 'AuditLog'];
    return model ? !excludedModels.includes(model) : false;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper method to clean database (for testing)
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter(
      key => typeof key === 'string' && key[0] !== '_' && key[0] === key[0].toLowerCase(),
    );

    return Promise.all(models.map(modelKey => (this as any)[modelKey].deleteMany()));
  }
}

