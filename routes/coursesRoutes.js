const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/', authenticate, coursesController.createCourse);

module.exports = router;