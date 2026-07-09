const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, studentController.getAllStudents);
router.get('/profile', authenticate, studentController.getStudentProfile);
router.post('/profile', authenticate, studentController.createStudentProfile);
router.post('/enroll', authenticate, studentController.enrollInCourse);
router.put('/grade', authenticate, studentController.updateGrade);

module.exports = router;