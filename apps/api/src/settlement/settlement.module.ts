import { Module } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { SettlementController } from './settlement.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [NotificationsModule],
    controllers: [SettlementController],
    providers: [SettlementService],
    exports: [SettlementService],
})
export class SettlementModule { }
