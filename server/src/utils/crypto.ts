import CryptoJS from 'crypto-js';

const BACKEND_SECRET = process.env.ENCRYPTION_KEY_LEVEL2 || 'backend_32char_secret_key_HERE!!';

/**
 * LEVEL 2 ENCRYPTION (Backend layer)
 * Frontend sends data already encrypted with Level-1 AES.
 * Backend applies another AES encryption on top before storing to MongoDB.
 */
export const encryptLevel2 = (data: string): string => {
  return CryptoJS.AES.encrypt(data, BACKEND_SECRET).toString();
};

/**
 * LEVEL 2 DECRYPTION
 * When fetching: backend decrypts its own layer, returns Level-1 encrypted data to frontend.
 * Frontend then decrypts its own layer to read plain text.
 */
export const decryptLevel2 = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, BACKEND_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Encrypt an entire student object (all sensitive fields).
 * Expects the value to already be Level-1 encrypted string from frontend.
 */
export const encryptStudentFields = (level1Encrypted: string): string => {
  return encryptLevel2(level1Encrypted);
};

/**
 * Decrypt the double-encrypted blob back to Level-1 encrypted form.
 */
export const decryptStudentFields = (doubleEncrypted: string): string => {
  return decryptLevel2(doubleEncrypted);
};
