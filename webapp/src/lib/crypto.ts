import * as nacl from 'tweetnacl';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';
import CryptoJS from 'crypto-js';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export function deriveKey(password: string, salt: string): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 100000,
  }).toString();
}

export function generateKeyPair(): KeyPair {
  const keyPair = nacl.box.keyPair();

  return {
    publicKey: encodeBase64(keyPair.publicKey),
    privateKey: encodeBase64(keyPair.secretKey),
  };
}

async function stringKeyToCryptoKey(keyString: string): Promise<CryptoKey> {
  const keyBuffer = new TextEncoder().encode(keyString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
  return crypto.subtle.importKey('raw', hashBuffer, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
}

async function aesGcmEncrypt(plaintext: string, key: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await stringKeyToCryptoKey(key);
  const messageBuffer = new TextEncoder().encode(plaintext);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    messageBuffer
  );

  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return encodeBase64(combined);
}

async function aesGcmDecrypt(ciphertext: string, key: string): Promise<string> {
  const combined = decodeBase64(ciphertext);
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const cryptoKey = await stringKeyToCryptoKey(key);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );

  return new TextDecoder().decode(decryptedBuffer);
}

export async function encryptPrivateKey(
  privateKey: string,
  userPasswordKey: string
): Promise<string> {
  return aesGcmEncrypt(privateKey, userPasswordKey);
}

export async function decryptPrivateKey(
  encryptedPrivateKey: string,
  userPasswordKey: string
): Promise<string> {
  try {
    const privateKey = await aesGcmDecrypt(encryptedPrivateKey, userPasswordKey);
    if (!privateKey) {
      throw new Error('Failed to decrypt private key');
    }
    return privateKey;
  } catch (error) {
    console.error('Failed to decrypt private key:', error);
    throw error;
  }
}

export async function encryptPassword(
  plainPassword: string,
  symetricKey: string
): Promise<string> {
  return aesGcmEncrypt(plainPassword, symetricKey);
}

export async function decryptPassword(
  encryptedPassword: string,
  symetricKey: string
): Promise<string> {
  try {
    return await aesGcmDecrypt(encryptedPassword, symetricKey);
  } catch (error) {
    console.error('Failed to decrypt password:', error);
    return '';
  }
}

function packNaclMessage(
  ephemeralPublicKey: Uint8Array,
  nonce: Uint8Array,
  encrypted: Uint8Array
): Uint8Array {
  const combined = new Uint8Array(
    ephemeralPublicKey.length + nonce.length + encrypted.length
  );
  combined.set(ephemeralPublicKey);
  combined.set(nonce, ephemeralPublicKey.length);
  combined.set(encrypted, ephemeralPublicKey.length + nonce.length);
  return combined;
}

function unpackNaclMessage(combined: Uint8Array) {
  const publicKeyLength = 32;
  const nonceLength = nacl.box.nonceLength;

  return {
    ephemeralPublicKey: combined.slice(0, publicKeyLength),
    nonce: combined.slice(publicKeyLength, publicKeyLength + nonceLength),
    ciphertext: combined.slice(publicKeyLength + nonceLength),
  };
}

export function encryptTeamPassword(plainPassword: string, publicKey: string): string {
  const recipientPublicKey = decodeBase64(publicKey);
  const ephemeralKeyPair = nacl.box.keyPair();

  const nonce = new Uint8Array(nacl.box.nonceLength);
  crypto.getRandomValues(nonce);

  const messageBytes = new TextEncoder().encode(plainPassword);

  const encrypted = nacl.box(
    messageBytes,
    nonce,
    recipientPublicKey,
    ephemeralKeyPair.secretKey
  );

  if (!encrypted) {
    throw new Error('Asymetric encryption failed');
  }

  const combined = packNaclMessage(ephemeralKeyPair.publicKey, nonce, encrypted);
  return encodeBase64(combined);
}

export function decryptTeamPassword(
  encryptedPassword: string,
  userPrivateKey: string
): string {
  const combined = decodeBase64(encryptedPassword);
  const { ephemeralPublicKey, nonce, ciphertext } = unpackNaclMessage(combined);

  const userSecretKey = decodeBase64(userPrivateKey);
  const decrypted = nacl.box.open(ciphertext, nonce, ephemeralPublicKey, userSecretKey);

  if (!decrypted) {
    throw new Error('Asymetric decryption failed');
  }

  return new TextDecoder().decode(decrypted);
}
