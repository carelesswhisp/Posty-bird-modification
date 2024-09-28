import Entity from 'src/server/database/models/entity.model';
import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';
import { CustomShortcut } from 'postybirb-commons';

export default class CustomShortcutEntity extends Entity implements CustomShortcut {
  @IsString()
  @IsNotEmpty()
  shortcut: string;

  @IsString()
  content: string;

  @IsBoolean()
  @IsNotEmpty()
  isDynamic: boolean;

  constructor(partial?: Partial<CustomShortcutEntity>) {
    super(partial);
  }
}
