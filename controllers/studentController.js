const pool = require('../config/db');

const getAllStudents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.student_number, s.first_name, s.last_name, s.date_of_birth, s.enrollment_date, u.email
       FROM students s
       JOIN users u ON s.user_id = u.id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get all students error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT s.id as student_id, s.student_number, s.first_name, s.last_name, s.date_of_birth, s.enrollment_date, u.email,
              c.id as course_id, c.course_code, c.course_name, c.credits, e.grade, e.enrolled_at
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN enrollments e ON s.id = e.student_id
       LEFT JOIN courses c ON e.course_id = c.id
       WHERE s.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const row = result.rows[0];
    const student = {
      id: row.student_id,
      student_number: row.student_number,
      first_name: row.first_name,
      last_name: row.last_name,
      date_of_birth: row.date_of_birth,
      enrollment_date: row.enrollment_date,
      email: row.email,
    };

    const enrollments = result.rows
      .filter((r) => r.course_id !== null)
      .map((r) => ({
        course_id: r.course_id,
        course_code: r.course_code,
        course_name: r.course_name,
        credits: r.credits,
        grade: r.grade,
        enrolled_at: r.enrolled_at,
      }));

    res.json({ student, enrollments });
  } catch (err) {
    console.error('Get student profile error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createStudentProfile = async (req, res) => {
  try {
    const { student_number, first_name, last_name, date_of_birth } = req.body;
    const userId = req.user.id;

    if (!student_number || !first_name || !last_name) {
      return res.status(400).json({ message: 'student_number, first_name, and last_name are required' });
    }

    const existing = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Student profile already exists' });
    }

    const result = await pool.query(
      `INSERT INTO students (user_id, student_number, first_name, last_name, date_of_birth)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, student_number, first_name, last_name, date_of_birth, enrollment_date, created_at`,
      [userId, student_number, first_name, last_name, date_of_birth]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create student profile error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Student number already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

const enrollInCourse = async (req, res) => {
  try {
    const { course_id } = req.body;
    const userId = req.user.id;

    if (!course_id) {
      return res.status(400).json({ message: 'course_id is required' });
    }

    const studentResult = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    const studentId = studentResult.rows[0].id;

    const courseResult = await pool.query('SELECT id FROM courses WHERE id = $1', [course_id]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const existing = await pool.query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, course_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Already enrolled in this course' });
    }

    const result = await pool.query(
      `INSERT INTO enrollments (student_id, course_id)
       VALUES ($1, $2)
       RETURNING id, student_id, course_id, grade, enrolled_at`,
      [studentId, course_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Enroll in course error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Already enrolled in this course' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateGrade = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { student_id, course_id, grade } = req.body;

    if (!student_id || !course_id || grade === undefined || grade === null) {
      return res.status(400).json({ message: 'student_id, course_id, and grade are required' });
    }

    const result = await pool.query(
      `UPDATE enrollments
       SET grade = $1
       WHERE student_id = $2 AND course_id = $3
       RETURNING id, student_id, course_id, grade, enrolled_at`,
      [grade, student_id, course_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found for this student and course' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update grade error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllStudents,
  getStudentProfile,
  createStudentProfile,
  enrollInCourse,
  updateGrade,
};