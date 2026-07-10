const pool = require('../config/db');

const createCourse = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { course_code, course_name, credits } = req.body;

    if (!course_code || !course_name || credits === undefined || credits === null) {
      return res.status(400).json({ message: 'course_code, course_name, and credits are required' });
    }

    const result = await pool.query(
      `INSERT INTO courses (course_code, course_name, credits)
       VALUES ($1, $2, $3)
       RETURNING id, course_code, course_name, credits, created_at`,
      [course_code, course_name, credits]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create course error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Course code already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { createCourse };