import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { SecurityModule } from './security/security.module';
import { AuthModule } from './auth/auth.module';
import { PatientModule } from './patient/patient.module';
import { ClinicalModule } from './clinical/clinical.module';
import { AppointmentModule } from './appointment/appointment.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
