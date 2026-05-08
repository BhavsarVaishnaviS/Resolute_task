import { Response } from 'express';
import crypto from 'crypto';
import Student from '../models/Student';
import { encryptStudentFields, decryptStudentFields } from '../utils/crypto';
import { AuthRequest } from '../middleware/auth';

const ADMIN_EMAIL = 'admin@gmail.com';

// Helper: SHA-256 hash of email for indexing
const hashEmail = (email: string): string =>
  crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');

/**
 * POST /api/register
 * - admin@gmail.com can register unlimited students
 * - Any other logged-in user can register only ONE student
 */
export const registerStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { encryptedPayload, emailHash } = req.body;
    const userEmail = (req.userEmail || '').toLowerCase().trim();

    if (!encryptedPayload || !emailHash) {
      res.status(400).json({ message: 'encryptedPayload and emailHash are required' });
      return;
    }

    // Non-admin users: allow only one student registration
    if (userEmail !== ADMIN_EMAIL) {
      const existingByUser = await Student.findOne({ registeredBy: userEmail });
      if (existingByUser) {
        res.status(403).json({
          message: 'You can only register one student. Only admin can register multiple students.',
        });
        return;
      }
    }

    // Check duplicate email (by hash)
    const existing = await Student.findOne({ emailHash });
    if (existing) {
      res.status(409).json({ message: 'A student with this email already exists' });
      return;
    }

    // Apply Level-2 encryption on top of frontend's Level-1
    const doubleEncrypted = encryptStudentFields(encryptedPayload);

    const student = new Student({ encryptedData: doubleEncrypted, emailHash, registeredBy: userEmail });
    await student.save();

    res.status(201).json({ message: 'Student registered successfully', id: student._id });
  } catch (err) {
    console.error('registerStudent error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * GET /api/students
 * Returns all students with Level-2 decrypted (still Level-1 encrypted) payloads.
 * Frontend will decrypt Level-1 to display plaintext.
 */
export const getAllStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userEmail = (req.userEmail || '').toLowerCase().trim();
    const isAdmin = userEmail === ADMIN_EMAIL;

    // Admin sees all students; others see only their own
    const query = isAdmin ? {} : { registeredBy: userEmail };
    const students = await Student.find(query).sort({ createdAt: -1 });

    const result = students.map((s) => ({
      id: s._id,
      encryptedPayload: decryptStudentFields(s.encryptedData), // strip Level-2
      registeredBy: s.registeredBy,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    res.status(200).json({ students: result, isAdmin, userEmail });
  } catch (err) {
    console.error('getAllStudents error:', err);
    res.status(500).json({ message: 'Server error fetching students' });
  }
};

/**
 * PUT /api/student/:id
 * Receives updated Level-1 encrypted payload. Re-applies Level-2 before storing.
 * Non-admin users can only edit their own student.
 */
export const updateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { encryptedPayload, emailHash } = req.body;
    const userEmail = (req.userEmail || '').toLowerCase().trim();
    const isAdmin = userEmail === ADMIN_EMAIL;

    if (!encryptedPayload || !emailHash) {
      res.status(400).json({ message: 'encryptedPayload and emailHash are required' });
      return;
    }

    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }
    if (!isAdmin && existingStudent.registeredBy !== userEmail) {
      res.status(403).json({ message: 'You are not allowed to edit this student' });
      return;
    }

    const doubleEncrypted = encryptStudentFields(encryptedPayload);
    await Student.findByIdAndUpdate(id, { encryptedData: doubleEncrypted, emailHash }, { new: true });

    res.status(200).json({ message: 'Student updated successfully' });
  } catch (err) {
    console.error('updateStudent error:', err);
    res.status(500).json({ message: 'Server error updating student' });
  }
};

/**
 * DELETE /api/student/:id
 * Non-admin users can only delete their own student.
 */
export const deleteStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userEmail = (req.userEmail || '').toLowerCase().trim();
    const isAdmin = userEmail === ADMIN_EMAIL;

    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }
    if (!isAdmin && existingStudent.registeredBy !== userEmail) {
      res.status(403).json({ message: 'You are not allowed to delete this student' });
      return;
    }

    await Student.findByIdAndDelete(id);
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('deleteStudent error:', err);
    res.status(500).json({ message: 'Server error deleting student' });
  }
};