import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  // 📝 Register New User
  async signUp(signUpDto: SignUpDto) {
    const { email, password, role, firstName, lastName } = signUpDto;

    // 1. Check if user exists
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Generate HealthFlo ID (Unified ID)
    // Format: HF-YYYY-RAND
    const healthFloId = `HF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Create User (Transaction to create Patient profile if needed)
    const newUser = await this.prisma.user.create({
      data: {
        email,
        phone: `TMP-${Date.now()}`, // Temp phone until verified
        password_hash: hashedPassword,
        full_name: `${firstName || ''} ${lastName || ''}`.trim(),
        role: role as Role || Role.PATIENT,
        // If role is PATIENT, we should eventually create a Patient profile
      },
    });

    // Auto-create Patient Profile if role is PATIENT
    if (newUser.role === Role.PATIENT) {
      await this.prisma.patient.create({
        data: {
          user_id: newUser.id,
          healthflo_id: healthFloId,
          clinic_id: 'GLOBAL', // Needs to be handled better in real app
          gender: 'UNKNOWN',
          dob: new Date(),
        }
      });
    }

    // 5. Generate Token
    const token = this.generateToken(newUser);

    return {
      message: 'Registration successful',
      healthFloId: newUser.role === Role.PATIENT ? healthFloId : null,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      access_token: token,
    };
  }

  // 🔐 Login
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Find User
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Compare Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Generate Token
    const token = this.generateToken(user);

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      access_token: token,
    };
  }

  private generateToken(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}
