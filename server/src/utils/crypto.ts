import CryptoJS from 'crypto-js';

const BACKEND_SECRET = process.env.ENCRYPTION_KEY_LEVEL2 || 'backend_32char_secret_key_HERE!!';

export const encryptLevel2 = (data: string): string => {
  return CryptoJS.AES.encrypt(data, BACKEND_SECRET).toString();
};

export const decryptLevel2 = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, BACKEND_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const encryptStudentFields = (
  level1Fields: Record<string, string>
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const key of Object.keys(level1Fields)) {
    result[key] = encryptLevel2(level1Fields[key]);
  }
  return result;
};

export const decryptStudentFields = (
  doubleEncryptedFields: Record<string, string>
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const key of Object.keys(doubleEncryptedFields)) {
    result[key] = decryptLevel2(doubleEncryptedFields[key]);
  }
  return result;
};