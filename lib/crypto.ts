// lib/crypto.ts
// Browser-native End-to-End Encryption using Web Crypto API (AES-GCM 256-bit)
// Automatically derives and manages device-local cryptographic keys without requiring user passwords.

const DEVICE_KEY_STORAGE_KEY = 'ais_translator_e2e_device_key_v1';

export interface EncryptedPayload {
  iv: string; // Base64
  cipherText: string; // Base64
  version: 1;
}

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = typeof atob !== 'undefined' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

/**
 * Retrieves the device's persistent AES-GCM CryptoKey from localStorage or generates a fresh one.
 */
async function getOrCreateDeviceKey(): Promise<CryptoKey | null> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }

  try {
    const storedRawKeyBase64 = localStorage.getItem(DEVICE_KEY_STORAGE_KEY);
    if (storedRawKeyBase64) {
      const rawKeyBuffer = base64ToArrayBuffer(storedRawKeyBase64);
      return await window.crypto.subtle.importKey(
        'raw',
        rawKeyBuffer,
        { name: 'AES-GCM', length: 256 },
        false, // not extractable after import
        ['encrypt', 'decrypt']
      );
    }

    // Generate new AES-GCM 256-bit key
    const newKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true, // extractable once to store in localStorage
      ['encrypt', 'decrypt']
    );

    const rawExported = await window.crypto.subtle.exportKey('raw', newKey);
    localStorage.setItem(DEVICE_KEY_STORAGE_KEY, arrayBufferToBase64(rawExported));

    return newKey;
  } catch (err) {
    console.warn('Web Crypto getOrCreateDeviceKey error:', err);
    return null;
  }
}

/**
 * Encrypts sensitive string data (e.g. API keys) using Web Crypto AES-GCM.
 */
export async function encryptSensitiveData(plainText: string): Promise<EncryptedPayload | null> {
  if (!plainText) return null;
  try {
    const key = await getOrCreateDeviceKey();
    if (!key || typeof window === 'undefined') return null;

    // 12-byte initialization vector for AES-GCM
    const ivBytes = new Uint8Array(12);
    window.crypto.getRandomValues(ivBytes);
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plainText);

    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: ivBytes },
      key,
      encodedData
    );

    return {
      iv: arrayBufferToBase64(ivBytes),
      cipherText: arrayBufferToBase64(cipherBuffer),
      version: 1,
    };
  } catch (err) {
    console.warn('Web Crypto encryption error:', err);
    return null;
  }
}

/**
 * Decrypts sensitive string data from an EncryptedPayload.
 */
export async function decryptSensitiveData(payload: EncryptedPayload | null | undefined): Promise<string> {
  if (!payload || !payload.iv || !payload.cipherText) return '';
  try {
    const key = await getOrCreateDeviceKey();
    if (!key || typeof window === 'undefined') return '';

    const ivBuffer = base64ToArrayBuffer(payload.iv);
    const ivBytes = new Uint8Array(ivBuffer);
    const cipherBuffer = base64ToArrayBuffer(payload.cipherText);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      key,
      cipherBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.warn('Web Crypto decryption error:', err);
    return '';
  }
}
