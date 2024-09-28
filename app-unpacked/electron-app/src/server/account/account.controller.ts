import { Controller, Post, Body, Delete, Param, Get, Patch } from '@nestjs/common';
import { AccountService } from './account.service';
import UserAccountEntity from './models/user-account.entity';
import { UserAccountDto } from 'postybirb-commons';

@Controller('account')
export class AccountController {
  constructor(private readonly service: AccountService) {}

  @Get()
  async findAll() {
    return this.service.getAll();
  }

  @Post('create')
  async create(@Body() createAccountDto: UserAccountEntity) {
    return this.service.createAccount(createAccountDto);
  }

  @Post('clear/:id')
  async clearData(@Param('id') id: string) {
    return this.service.clearCookiesAndData(id);
  }

  @Patch('data/:id')
  async setData(@Body() body: { data: any }, @Param('id') id: string) {
    return this.service.setData(id, body.data);
  }

  @Patch('rename')
  async rename(@Body() body: { id: string; alias: string }) {
    return this.service.renameAccount(body.id, body.alias);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.removeAccount(id);
  }

  @Get('check/:id')
  async checkLogin(@Param('id') id: string): Promise<UserAccountDto> {
    return this.service.checkLogin(id);
  }

  @Get('statuses')
  loginStatuses(): UserAccountDto[] {
    return this.service.getLoginStatuses();
  }
}
