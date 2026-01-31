import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { SecurityModule } from './security/security.module';
import { AuthModule } from './auth/auth.module';
import { PatientModule } from './patient/patient.module';
import { ClinicalModule } from './clinical/clinical.module';
import { AppointmentModule } from './appointment/appointment.module';
import { BillingModule } from './billing/billing.module';
import { StaffModule } from './staff/staff.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettlementModule } from './settlement/settlement.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 🐘 Connect to Postgres via Prisma
    PrismaModule,

    // 🔒 Security Features (Encryption)
    SecurityModule,

    // 🔐 Auth Feature
    AuthModule,

    // 👥 Patient Feature
    PatientModule,

    // 🏥 Clinical Data
    ClinicalModule,

    // 📅 Appointment & Queue
    AppointmentModule,

    // 💰 Billing & Finance
    BillingModule,

    // 👥 Staff & RBAC
    StaffModule,

    // 🔔 Notifications
    NotificationsModule,

    // 🧾 End of Day Settlement
    SettlementModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
