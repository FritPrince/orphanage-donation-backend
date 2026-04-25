import { PartialType } from '@nestjs/swagger';
import { CreateOrphanageDto } from './create-orphanage.dto';

export class UpdateOrphanageDto extends PartialType(CreateOrphanageDto) {}
