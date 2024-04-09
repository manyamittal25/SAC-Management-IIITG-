const pool = require("./connect");

// Function to get all students
async function getAllStudents() {
  return new Promise((resolve, reject) => {
    const selectQuery = `SELECT * FROM students`;
    pool.query(selectQuery, (err, results) => {
      if (err) {
        console.error("Error fetching students: " + err.stack);
        return reject(err);
      }
      resolve(results);
    });
  });
}

// Function to get a student by ID
async function getStudentById(studentId) {
  return new Promise((resolve, reject) => {
    const selectQuery = `SELECT * FROM students WHERE s_id = ?`;
    pool.query(selectQuery, [studentId], (err, results) => {
      if (err) {
        console.error("Error fetching student: " + err.stack);
        return reject(err);
      }
      if (results.length === 0) {
        console.error("Student not found");
        return reject(new Error("Student not found"));
      }
      resolve(results[0]);
    });
  });
}

// Function to get a student by ID
async function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    const selectQuery = `SELECT s_id FROM students WHERE email = ?`;
    pool.query(selectQuery, [email], (err, results) => {
      if (err) {
        console.error("Error fetching student: " + err.stack);
        return reject(err);
      }
      if (results.length === 0) {
        console.error("Student not found");
        return reject(new Error("Student not found"));
      }
      resolve(results[0]);
    });
  });
}

// Function to get a student by Email and Password
async function getStudentByEmailPass(email, password) {
  return new Promise((resolve, reject) => {
    const selectQuery = `SELECT * FROM students WHERE email = ? AND password = ?`;
    pool.query(selectQuery, [email, password], (err, results) => {
      if (err) {
        console.error("Error fetching student: " + err.stack);
        return reject(err);
      }
      if (results.length === 0) {
        console.error("Student not found");
        return resolve(null); // Return null when no student is found
      }
      resolve(results[0]);
    });
  });
}

// Function to get a student by Email and Password
async function getStudentByEmailRollPass(email, password, roll) {
  return new Promise((resolve, reject) => {
    const selectQuery = `SELECT * FROM students WHERE email = ? AND roll = ?`;
    pool.query(selectQuery, [email, password, roll], (err, results) => {
      if (err) {
        console.error("Error fetching student: " + err.stack);
        return reject(err);
      }
      if (results.length === 0) {
        console.error("Student not found");
        return resolve(null); // Return null when no student is found
      }
      resolve(results[0]);
    });
  });
}

// Function to create a student
async function createStudent(studentData) {
  return new Promise((resolve, reject) => {
    const { name, roll, email, password } = studentData;
    const insertQuery = `INSERT INTO students (name, roll, email, password) VALUES (?, ?, ?, ?)`;
    pool.query(insertQuery, [name, roll, email, password], (err, results) => {
      if (err) {
        console.error("Error creating student: " + err.stack);
        return reject(err);
      }
      console.log("Student created successfully");
      const studentId = results.insertId; // Get the ID of the newly created student
      // Retrieve the created student by their ID
      getStudentById(studentId)
        .then((student) => {
          resolve(student); // Resolve with the created student
        })
        .catch((err) => {
          reject(err); // Reject if there's an error retrieving the student
        });
    });
  });
}

// Function to update a student
async function updateStudent(studentId, updatedData) {
  return new Promise((resolve, reject) => {
    const { name, roll, email, password } = updatedData;
    const updateQuery = `UPDATE students SET name = ?, roll = ?, email = ?, password = ? WHERE s_id = ?`;
    pool.query(
      updateQuery,
      [name, roll, email, password, studentId],
      (err, results) => {
        if (err) {
          console.error("Error updating student: " + err.stack);
          return reject(err);
        }
        console.log("Student updated successfully");
        resolve(results.affectedRows);
      }
    );
  });
}

// Function to delete a student
async function deleteStudent(studentId) {
  return new Promise((resolve, reject) => {
    const deleteQuery = `DELETE FROM students WHERE s_id = ?`;
    pool.query(deleteQuery, [studentId], (err, results) => {
      if (err) {
        console.error("Error deleting student: " + err.stack);
        return reject(err);
      }
      console.log("Student deleted successfully");
      resolve(results.affectedRows);
    });
  });
}

module.exports = {
  getAllStudents,
  getStudentById,
  getStudentByEmailPass,
  getStudentByEmailRollPass,
  getUserByEmail,
  createStudent,
  updateStudent,
  deleteStudent,
};
