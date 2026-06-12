import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../../schemas/user.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('api/v1/users')
export class UsersController {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  @Get()
  async findAll() {
    return this.userModel.find().populate('departmentId').sort({ username: 1 }).exec();
  }

  @Post()
  async create(@Body() body: any) {
    const { username, password, fullName, departmentId, role } = body;
    const existing = await this.userModel.findOne({ username }).exec();
    if (existing) {
      throw new ConflictException('Tài khoản đã tồn tại');
    }
    const passwordHash = await bcrypt.hash(password || 'Staff@MXV123', 10);
    const newUser = new this.userModel({
      username,
      passwordHash,
      fullName,
      departmentId,
      role,
    });
    return newUser.save();
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const { password, ...rest } = body;
    const updateData: any = { ...rest };
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).populate('departmentId').exec();
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}
