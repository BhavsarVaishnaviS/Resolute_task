import CryptoJS from 'crypto-js';

const getFrontendSecret = (): string =>
  process.env.ENCRYPTION_KEY_LEVEL1 || 'frontend_32char_secret_key_HERE!';

const getBackendSecret = (): string =>
  process.env.ENCRYPTION_KEY_LEVEL2 || 'backend_32char_secret_key_HERE!!';


export const decryptLevel1 = (encryptedData: string): string => {
  if (typeof encryptedData !== 'string' || encryptedData.trim() === '') {
    throw new Error('decryptLevel1: input is empty or not a string');
  }
  const bytes = CryptoJS.AES.decrypt(encryptedData, getFrontendSecret());
  if (!bytes || bytes.sigBytes <= 0) {
    throw new Error('decryptLevel1: decryption produced empty result — wrong key?');
  }
  const result = bytes.toString(CryptoJS.enc.Utf8);
  if (!result) {
    throw new Error('decryptLevel1: decrypted to empty string — wrong key or corrupted data');
  }
  return result;
};


export const encryptLevel2 = (data: string): string => {
  if (typeof data !== 'string') throw new Error(`encryptLevel2: expected string, got ${typeof data}`);
  return CryptoJS.AES.encrypt(data, getBackendSecret()).toString();
};

export const decryptLevel2 = (encryptedData: string): string => {
  if (typeof encryptedData !== 'string' || encryptedData.trim() === '') {
    throw new Error('decryptLevel2: input is empty or not a string');
  }
  const bytes = CryptoJS.AES.decrypt(encryptedData, getBackendSecret());
  if (!bytes || bytes.sigBytes <= 0) {
    throw new Error('decryptLevel2: decryption produced empty result — wrong key?');
  }
  const result = bytes.toString(CryptoJS.enc.Utf8);
  if (!result) {
    throw new Error('decryptLevel2: decrypted to empty string — wrong key or corrupted data');
  }
  return result;
};


export const encryptStudentFields = (
  level1Fields: Record<string, string>
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const key of Object.keys(level1Fields)) {
    if (typeof level1Fields[key] !== 'string') {
      throw new Error(`encryptStudentFields: field "${key}" is not a string`);
    }
    const plaintext = decryptLevel1(level1Fields[key]); // strip Level-1
    result[key] = encryptLevel2(plaintext);              // apply Level-2
  }
  return result;
};


export const decryptStudentFields = (
  storedFields: Record<string, string>
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const key of Object.keys(storedFields)) {
    const raw = storedFields[key];
    try {
      result[key] = decryptLevel2(raw); // normal path: Level-2 → plaintext
    } catch {
      try {
        result[key] = decryptLevel1(raw); // fallback: legacy Level-1 → plaintext
      } catch {
        console.error(`decryptStudentFields: could not decrypt field "${key}" with either key`);
        result[key] = '';
      }
    }
  }
  return result;
};
