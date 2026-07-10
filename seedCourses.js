require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const courses = [
  { course_code: 'SE101', course_name: 'Software Engineering', credits: 4 },
  { course_code: 'WD201', course_name: 'Web Development', credits: 3 },
  { course_code: 'DB301', course_name: 'Database Management Systems', credits: 3 },
];

(async () => {
  try {
    await pool.query('SELECT NOW();');
    console.log('Database connected');

    const inserted = [];

    for (const course of courses) {
      const res = await pool.query(
        `INSERT INTO courses (course_code, course_name, credits)
         VALUES ($1, $2, $3)
         ON CONFLICT (course_code) DO NOTHING
         RETURNING id, course_code, course_name, credits`,
        [course.course_code, course.course_name, course.credits]
      );

      if (res.rows.length > 0) {
        inserted.push(res.rows[0]);
      }
    }

    if (inserted.length === 0) {
      console.log('All courses already exist. No new records inserted.');
    } else {
      console.log('Inserted courses:');
      inserted.forEach((c) => {
        console.log(`  - ${c.course_code}: ${c.course_name} (${c.credits} credits) | UUID: ${c.id}`);
      });
    }
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();