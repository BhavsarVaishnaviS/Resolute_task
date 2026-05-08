export interface StudentFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  courseEnrolled: string;
  password: string;
}

export interface StudentRecord {
  id: string;
  encryptedPayload: string;
  createdAt: string;
  updatedAt: string;
  // Populated after decryption on client
  data?: StudentFormData;
}

export interface AuthContextType {
  token: string | null;
  userEmail: string | null;
  login: (email: string, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}
