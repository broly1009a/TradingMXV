import { Controller, Post, Body, Patch, Get, Query, UseGuards, Request, Param } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post('initialize')
  async initialize(@Request() req: any, @Body() body: any) {
    const { templateId, shiftDate } = body;
    const userId = req.user._id || req.user.id;
    return this.shiftsService.initializeShift(templateId, userId, shiftDate);
  }

  @Patch('items/toggle')
  async toggleItem(@Request() req: any, @Body() body: any) {
    const { shiftLogId, taskId, isChecked, note } = body;
    const userId = req.user._id || req.user.id;
    return this.shiftsService.toggleTask(shiftLogId, taskId, isChecked, userId, note);
  }

  @Post('close')
  async close(@Body() body: any) {
    const { shiftLogId } = body;
    return this.shiftsService.closeShift(shiftLogId);
  }

  @Get('history')
  async getHistory(
    @Query('departmentId') departmentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.shiftsService.getHistory(departmentId, startDate, endDate, status);
  }

  @Get('active')
  async getActive(
    @Query('departmentId') departmentId: string,
    @Query('shiftDate') shiftDate?: string,
  ) {
    return this.shiftsService.getActiveShiftsByDepartment(departmentId, shiftDate);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.shiftsService.getShiftById(id);
  }

  @Get(':id/audit-logs')
  async getAuditLogs(@Param('id') id: string) {
    return this.shiftsService.getAuditLogs(id);
  }
}
