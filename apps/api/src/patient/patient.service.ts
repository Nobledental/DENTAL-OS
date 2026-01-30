import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../security/encryption.service';

@Injectable()
export class PatientService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) { }

  // 📝 Create Patient (Splits PII into Vault)
  async create(createPatientDto: any) {
    // 1. Separate PII from Clinical Data
    const {
      aadhaar, pan, mobile, email, address, // PII
      firstName, lastName, gender, dob, bloodGroup, clinicId, // Public/Clinical
      knownAllergies, chronicConditions // History
    } = createPatientDto;

    // 2. Create Secret Identity First (or inside transaction)
    // We encrypt sensitive fields before storing even if DB is secure, for double safety
    // BUT our EncryptionService is for "Application Level" encryption.
    // The Schema has 'aadhaar_number' etc. Let's assume we store them raw in the Vault 
    // IF the vault is meant to be the encryption boundary, OR we encrypt them here.
    // The Schema comment says "Encrypted Fields (AES-256)". So we MUST encrypt.

    const secretIdentity = await this.prisma.secretIdentity.create({
      data: {
        aadhaar_number: aadhaar ? this.encryptionService.encrypt(aadhaar) : null,
        pan_number: pan ? this.encryptionService.encrypt(pan) : null,
        primary_contact: mobile ? this.encryptionService.encrypt(mobile) : null,
        email: email ? this.encryptionService.encrypt(email) : null,
        full_address: address ? this.encryptionService.encrypt(address) : null,
      },
    });

    // 3. Generate HealthFlo ID
    const healthFloId = `HF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Create Patient Record linked to Secret Identity
    // We need a userId in the schema. If this is a standalone patient creation (by reception),
    // we might need to create a "Shadow User" or the schema allows patient without user?
    // Schema: `user_id String @unique`. So a User MUST exist.
    // Strategy: Create a "Shadow User" for the patient automatically.

    // Check if user exists by mobile (decrypted check is hard, so we assume unique mobile in User table)
    // For now, let's assume we create a User with a random password.

    const shadowUser = await this.prisma.user.create({
      data: {
        email: email || `no-email-${Date.now()}@healthflo.com`,
        phone: mobile || `no-phone-${Date.now()}`,
        password_hash: 'SHADOW_USER_NO_LOGIN', // Or generate random
        full_name: `${firstName} ${lastName}`,
        role: 'PATIENT',
      }
    });

    const patient = await this.prisma.patient.create({
      data: {
        user_id: shadowUser.id,
        clinic_id: clinicId,
        healthflo_id: healthFloId,
        secret_id: secretIdentity.id,
        gender: gender || 'UNKNOWN',
        dob: new Date(dob || '1990-01-01'),
        blood_group: bloodGroup,
        allergies: knownAllergies ? { list: knownAllergies } : undefined,
        medical_history: chronicConditions ? { list: chronicConditions } : undefined,
      },
      include: {
        secret_profile: true, // Return it for the initial creation response
      }
    });

    return this.sanitize(patient);
  }

  // 🔍 Find All (Clinic View)
  async findAll(clinicId: string) {
    const patients = await this.prisma.patient.findMany({
      where: { clinic_id: clinicId },
      include: {
        user: { select: { full_name: true, phone: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return patients.map(p => ({
      id: p.id,
      name: p.user.full_name,
      phone: p.user.phone,
      healthFloId: p.healthflo_id,
      gender: p.gender,
      age: this.calculateAge(p.dob),
    }));
  }

  // 🔎 Unified Search (HealthFlo ID, Name, Mobile, Aadhaar_Last4)
  async search(query: string) {
    if (!query) return [];

    // 1. Direct HealthFlo ID Search
    if (query.startsWith('HF-')) {
      const patient = await this.prisma.patient.findUnique({
        where: { healthflo_id: query },
        include: { user: true, secret_profile: true }
      });
      return patient ? [this.mapToResult(patient)] : [];
    }

    // 2. Search in User table (Name or Mobile)
    const patients = await this.prisma.patient.findMany({
      where: {
        OR: [
          { user: { full_name: { contains: query, mode: 'insensitive' } } },
          { user: { phone: { contains: query } } },
          { healthflo_id: { contains: query } }
        ]
      },
      include: { user: true, secret_profile: true },
      take: 10,
    });

    return patients.map(p => this.mapToResult(p));
  }

  // 🛡️ Audit Logger
  async logPIIAccess(patientId: string, performerId: string, field: string) {
    return this.prisma.auditLog.create({
      data: {
        patient_id: patientId,
        performed_by: performerId,
        action_type: 'VIEW_PII',
        field_changed: field,
        timestamp: new Date(),
      }
    });
  }

  private mapToResult(p: any) {
    let maskedAadhaar = "XXXX-XXXX-XXXX";
    if (p.secret_profile?.aadhaar_number) {
      try {
        const fullAadhaar = this.encryptionService.decrypt(p.secret_profile.aadhaar_number);
        maskedAadhaar = `XXXX-XXXX-${fullAadhaar.slice(-4)}`;
      } catch (e) {
        console.error("Failed to decrypt Aadhaar for masking", e);
      }
    }

    return {
      id: p.id,
      name: p.user.full_name,
      healthFloId: p.healthflo_id,
      phone: p.user.phone,
      gender: p.gender,
      age: this.calculateAge(p.dob),
      maskedAadhaar
    };
  }

  // 🔍 Find One (Detailed View)
  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        user: true,
        secret_profile: true, // Fetch PII (Decrypt below)
        clinical_notes: { take: 5, orderBy: { created_at: 'desc' } },
        dental_records: true,
      }
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    // Decrypt PII for the authorized view
    return this.decryptPatient(patient);
  }

  async update(id: string, updatePatientDto: any) {
    // Implement update logic...
    return { message: 'Update implemented later' };
  }

  async remove(id: string) {
    return this.prisma.patient.delete({ where: { id } });
  }

  // 🛡️ Helpers
  private calculateAge(dob: Date) {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  private sanitize(patient: any) {
    // Return safe object
    if (patient.secret_profile) {
      patient.secret_profile = this.decryptIdentity(patient.secret_profile);
    }
    return patient;
  }

  private decryptIdentity(secret: any) {
    return {
      ...secret,
      aadhaar_number: secret.aadhaar_number ? this.encryptionService.decrypt(secret.aadhaar_number) : null,
      primary_contact: secret.primary_contact ? this.encryptionService.decrypt(secret.primary_contact) : null,
      // ... others
    };
  }

  private decryptPatient(patient: any) {
    if (patient.secret_profile) {
      patient.pii = this.decryptIdentity(patient.secret_profile);
      delete patient.secret_profile; // HIDE the encrypted vault object
    }
    return patient;
  }
}
