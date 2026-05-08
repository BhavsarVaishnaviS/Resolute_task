import CryptoJS from 'crypto-js';

// This key is shared between frontend and frontend only.
// In production, derive it from the user's password or a secure env variable.
// const FRONTEND_SECRET = process.env.REACT_APP_ENCRYPTION_KEY || 'frontend_32char_secret_key_HERE!';
// ✅ Vite syntax
const FRONTEND_SECRET = import.meta.env.VITE_ENCRYPTION_KEY;
/**
 * LEVEL 1 ENCRYPTION (Frontend layer)
 * Encrypts plaintext before sending to the backend.
 * Backend will add its own Level-2 encryption on top before storing.
 */
export const encryptLevel1 = (data: string): string => {
  return CryptoJS.AES.encrypt(data, FRONTEND_SECRET).toString();
};

/**
 * LEVEL 1 DECRYPTION
 * Called after backend strips its Level-2 layer and returns Level-1 encrypted data.
 */
export const decryptLevel1 = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, FRONTEND_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Encrypt a full student object as JSON string (Level 1)
 */
export const encryptStudentPayload = (studentData: object): string => {
  return encryptLevel1(JSON.stringify(studentData));
};

/**
 * Decrypt the Level-1 encrypted payload and parse JSON
 */
export const decryptStudentPayload = <T>(encryptedPayload: string): T => {
  const json = decryptLevel1(encryptedPayload);
  return JSON.parse(json) as T;
};

/**
 * Hash email (SHA-256) for server-side uniqueness check without exposing plaintext
 */
export const hashEmailForIndex = (email: string): string => {
  return CryptoJS.SHA256(email.toLowerCase().trim()).toString();
};
