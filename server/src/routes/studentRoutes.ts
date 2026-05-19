import { Router } from 'express';
import {
  registerStudent,
  getAllStudents,
  updateStudent,
  deleteStudent,
} from '../controllers/studentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', authMiddleware, registerStudent);
router.get('/students', authMiddleware, getAllStudents);
router.put('/student/:id', authMiddleware, updateStudent);
router.delete('/student/:id', authMiddleware, deleteStudent);

export default router;
