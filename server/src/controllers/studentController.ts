import { Request, Response } from 'express';
import Student from '../models/Student';
import { encryptStudentFields, decryptStudentFields } from '../utils/crypto';

export const registerStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { encryptedFields, emailHash } = req.body;

    if (!encryptedFields || typeof encryptedFields !== 'object' || !emailHash) {
      res.status(400).json({ message: 'encryptedFields (object) and emailHash are required' });
      return;
    }

    const existing = await Student.findOne({ emailHash });
    if (existing) {
      res.status(409).json({ message: 'A student with this email already exists' });
      return;
    }

    const doubleEncryptedFields = encryptStudentFields(encryptedFields);

    const student = new Student({ encryptedFields: doubleEncryptedFields, emailHash });
    await student.save();

    res.status(201).json({ message: 'Student registered successfully', id: student._id });
  } catch (err) {
    console.error('registerStudent error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const getAllStudents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });

    const result = students.map((s) => {
  if (!s.encryptedFields) {
    return {
      id: s._id,
      encryptedFields: {},
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  const rawFields =
    s.encryptedFields instanceof Map
      ? Object.fromEntries(s.encryptedFields)
      : (s.encryptedFields as Record<string, string>);

  return {
    id: s._id,
    encryptedFields: decryptStudentFields(rawFields),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
});

    res.status(200).json(result);
  } catch (err) {
    console.error('getAllStudents error:', err);
    res.status(500).json({ message: 'Server error fetching students' });
  }
};

export const updateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { encryptedFields, emailHash } = req.body;

    if (!encryptedFields || typeof encryptedFields !== 'object' || !emailHash) {
      res.status(400).json({ message: 'encryptedFields (object) and emailHash are required' });
      return;
    }

    const duplicate = await Student.findOne({ emailHash, _id: { $ne: id } });
    if (duplicate) {
      res.status(409).json({ message: 'Another student with this email already exists' });
      return;
    }

    const doubleEncryptedFields = encryptStudentFields(encryptedFields);

    const student = await Student.findByIdAndUpdate(
      id,
      { encryptedFields: doubleEncryptedFields, emailHash },
      { new: true }
    );

    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    res.status(200).json({ message: 'Student updated successfully' });
  } catch (err) {
    console.error('updateStudent error:', err);
    res.status(500).json({ message: 'Server error updating student' });
  }
};

export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);

    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('deleteStudent error:', err);
    res.status(500).json({ message: 'Server error deleting student' });
  }
};