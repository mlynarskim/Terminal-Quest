import { describe, it, expect } from 'vitest';
import { ROT_N, decodeHex, ENCRYPTED_FILES, encryptFile, decryptFile } from './ciphers';

describe('ciphers', () => {
  it('ROT_N with shift 0 is identity', () => {
    expect(ROT_N('HELLO', 0)).toBe('HELLO');
  });

  it('ROT_N with shift 13 is ROT13', () => {
    expect(ROT_N('HELLO', 13)).toBe('URYYB');
    expect(ROT_N('URYYB', 13)).toBe('HELLO');
  });

  it('decodeHex decodes hex escape sequences', () => {
    expect(decodeHex('\\x48\\x69')).toBe('Hi');
  });

  it('encryptFile produces ciphertext for ROT', () => {
    const file = ENCRYPTED_FILES.find((f) => f.cipher === 'rot');
    const enc = encryptFile(file);
    expect(enc.content).not.toBe(file.plaintext);
  });

  it('decryptFile recovers plaintext for ROT', () => {
    const file = ENCRYPTED_FILES.find((f) => f.cipher === 'rot');
    const enc = encryptFile(file);
    const dec = decryptFile(enc);
    expect(dec).toBe(file.plaintext);
  });

  it('decryptFile recovers plaintext for HEX', () => {
    const file = ENCRYPTED_FILES.find((f) => f.cipher === 'hex');
    const enc = encryptFile(file);
    const dec = decryptFile(enc);
    expect(dec).toBe(file.plaintext);
  });

  it('decryptFile recovers plaintext for XOR', () => {
    const file = ENCRYPTED_FILES.find((f) => f.cipher === 'xor');
    const enc = encryptFile(file);
    const dec = decryptFile(enc);
    expect(dec).toBe(file.plaintext);
  });

  it('ENCRYPTED_FILES has expected paths', () => {
    const paths = ENCRYPTED_FILES.map((f) => f.path);
    expect(paths).toContain('/logs/cipher_alpha.log');
    expect(paths).toContain('/archives/encrypted.dat');
    expect(paths).toContain('/system/cipher_beta.sys');
    expect(paths).toContain('/users/explorer/journal.enc');
    expect(paths).toContain('/home/secrets.txt.enc');
  });
});
