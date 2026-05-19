import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { decryptLevel1 } from '../utils/crypto';

/** Safely decrypt a Level-1 encrypted value; returns null on failure. */
function decryptPassword(encryptedPassword: string): string | null {
  try {
    const plain = decryptLevel1(encryptedPassword);
    return plain || null;
  } catch {
    return null;
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password: encryptedPassword } = req.body;

    if (!email || !encryptedPassword) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Decrypt Level-1 before bcrypt comparison
    const password = decryptPassword(encryptedPassword);
    if (!password) {
      res.status(400).json({ message: 'Invalid request format' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({ token, email: user.email });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password: encryptedPassword } = req.body;

    if (!email || !encryptedPassword) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // ── Duplicate email check FIRST — before any crypto work ──────────────
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    // Decrypt Level-1 before bcrypt hashing
    const password = decryptPassword(encryptedPassword);
    if (!password) {
      res.status(400).json({ message: 'Invalid request format' });
      return;
    }

    const user = new User({ email, password });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, email: user.email });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};
