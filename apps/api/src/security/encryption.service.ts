import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService implements OnModuleInit {
    private algorithm = 'aes-256-cbc';
    private key!: Buffer;
    private ivLength = 16;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const keyString = this.configService.get<string>('ENCRYPTION_KEY');
        if (!keyString || keyString.length !== 32) {
            // In dev, we might accept a placeholder or error out. 
            // For now, if it's the placeholder, we warn.
            console.warn('⚠️ ENCRYPTION_KEY is not set or invalid length (must be 32 chars). Encryption will fail.');
            // We can create a dummy key for dev if needed, but better to fail or warn.
            this.key = crypto.randomBytes(32); // Fallback for pure initialization (Change in Prod)
        } else {
            this.key = Buffer.from(keyString);
        }
    }

    encrypt(text: string): string {
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.key), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
    }

    decrypt(text: string): string {
        const textParts = text.split(':');
        const ivHex = textParts.shift();
        if (!ivHex) throw new Error('Invalid encrypted text format');

        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
}
