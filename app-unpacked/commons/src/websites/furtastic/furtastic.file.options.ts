import { Expose } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { DefaultFileOptions } from '../../interfaces/submission/default-options.interface';
import { FurtasticFileOptions } from '../../interfaces/websites/furtastic/furtastic.file.options.interface';
import { DefaultValue } from '../../models/decorators/default-value.decorator';
import { DefaultFileOptionsEntity } from '../../models/default-file-options.entity';

// tslint:disable-next-line: class-name
export class FurtasticFileOptionsEntity extends DefaultFileOptionsEntity implements FurtasticFileOptions {
  @Expose()
  @IsArray()
  @DefaultValue([])
  sources!: string[];

  @Expose()
  @IsOptional()
  @IsString()
  parentId?: string;

  constructor(entity?: Partial<FurtasticFileOptions>) {
    super(entity as DefaultFileOptions);
  }
}
