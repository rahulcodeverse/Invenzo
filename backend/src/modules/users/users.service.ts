import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PasswordHelper } from '../../common/utils/password.helper';
import { PaginationHelper } from '../../common/utils/pagination.helper';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await PasswordHelper.hash(createUserDto.password);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        tenantId,
      },
    });

    const sanitized = this.sanitizeUser(user);
    return {
      ...sanitized,
      isActive: sanitized.status === 'ACTIVE',
    };
  }

  async findAll(tenantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = paginationDto;
    const { skip, take } = PaginationHelper.getSkipTake(page, limit);

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          avatar: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Add isActive field based on status
    const usersWithIsActive = users.map(user => ({
      ...user,
      isActive: user.status === 'ACTIVE',
    }));

    return PaginationHelper.paginate(usersWithIsActive, total, page, limit);
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      isActive: user.status === 'ACTIVE',
    };
  }

  async update(id: string, tenantId: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    const sanitized = this.sanitizeUser(user);
    return {
      ...sanitized,
      isActive: sanitized.status === 'ACTIVE',
    };
  }

  async remove(id: string, tenantId: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await PasswordHelper.compare(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    // Hash new password
    const hashedPassword = await PasswordHelper.hash(changePasswordDto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  private sanitizeUser(user: any) {
    const { password, refreshToken, resetToken, resetTokenExpiry, ...sanitized } = user;
    return sanitized;
  }
}

