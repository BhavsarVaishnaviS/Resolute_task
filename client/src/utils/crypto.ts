import CryptoJS from 'crypto-js';

const FRONTEND_SECRET = import.meta.env.VITE_ENCRYPTION_KEY as string;

if (!FRONTEND_SECRET) {
  console.warn(
    '[crypto] WARNING: VITE_ENCRYPTION_KEY is not set. ' +
    'Encryption will fail at runtime. Set it in your .env file.'
  );
}


export const encryptLevel1 = (data: string): string =>
  CryptoJS.AES.encrypt(data, FRONTEND_SECRET).toString();

export const decryptLevel1 = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, FRONTEND_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};


export const encryptStudentFields = <T extends Record<string, unknown>>(
  studentData: T
): Record<string, string> => {
  const encrypted: Record<string, string> = {};
  for (const key of Object.keys(studentData)) {
    const val = studentData[key];
    encrypted[key] = encryptLevel1(val !== undefined && val !== null ? String(val) : '');
  }
  return encrypted;
};


export const decryptStudentFields = <T>(encryptedFields: Record<string, string>): T => {
  const decrypted: Record<string, string> = {};
  for (const key of Object.keys(encryptedFields)) {
    decrypted[key] = decryptLevel1(encryptedFields[key]);
  }
  return decrypted as unknown as T;
};


export const hashEmailForIndex = (email: string): string =>
  CryptoJS.SHA256(email.toLowerCase().trim()).toString();
