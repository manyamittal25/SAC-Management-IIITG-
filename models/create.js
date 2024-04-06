const dotenv = require("dotenv");
const mysql = require("mysql");

dotenv.config(); // Load environment variables from .env file

// Create a MySQL connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Connect to MySQL server
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: " + err.stack);
    return;
  }
  console.log("Connected to MySQL as id " + connection.threadId);

  // Create database and tables
  createDatabaseAndTables();
});

// Function to create database and tables
function createDatabaseAndTables() {
  // Create the database if it doesn't exist
  const createDatabaseQuery =
    "CREATE DATABASE IF NOT EXISTS " + process.env.DB_DATABASE;
  executeQuery(
    createDatabaseQuery,
    "Database creation successful",
    "Error creating database"
  );

  // Use the specified database
  const useDatabaseQuery = "USE " + process.env.DB_DATABASE;
  executeQuery(
    useDatabaseQuery,
    "Database selected successfully",
    "Error selecting database"
  );

  // Define the SQL statement to create the students table
  const createStudentsTableQuery = `
    CREATE TABLE IF NOT EXISTS students (
      s_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      roll VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL
    )
  `;
  executeQuery(
    createStudentsTableQuery,
    "Students table created successfully",
    "Error creating students table"
  );

  // Define the SQL statement to create the rooms table
  const createRoomsTableQuery = `
    CREATE TABLE IF NOT EXISTS rooms (
      r_id INT AUTO_INCREMENT PRIMARY KEY,
      r_name VARCHAR(100) NOT NULL
    )
  `;
  executeQuery(
    createRoomsTableQuery,
    "Rooms table created successfully",
    "Error creating rooms table"
  );

  // Define the SQL statement to create the room_allotment table
  const createRoomAllotmentTableQuery = `
    CREATE TABLE IF NOT EXISTS room_allotment (
      a_id INT AUTO_INCREMENT PRIMARY KEY,
      s_id INT,
      r_id INT,
      start_time DATETIME,
      end_time DATETIME,
      description VARCHAR(255),
      status ENUM('pending', 'approved') DEFAULT 'pending',
      CONSTRAINT check_duration CHECK (TIMESTAMPDIFF(HOUR, start_time, end_time) <= 3),
      FOREIGN KEY (s_id) REFERENCES students(s_id),
      FOREIGN KEY (r_id) REFERENCES rooms(r_id) ON DELETE CASCADE
    )
  `;

  executeQuery(
    createRoomAllotmentTableQuery,
    "Room allotment table created successfully",
    "Error creating room allotment table"
  );

  const createBadmintonCourts = `
    CREATE TABLE IF NOT EXISTS badminton_courts (
      court_id INT AUTO_INCREMENT PRIMARY KEY,
      court_name VARCHAR(100) NOT NULL,
      court_status ENUM('Available', 'Occupied') DEFAULT 'Available'
    )
  `;

  // Execute query for creating badminton courts table
  executeQuery(
    createBadmintonCourts,
    "Badminton courts table created successfully",
    "Error creating badminton courts table"
  );

  const createBadmintonCourtAllotment = `
    CREATE TABLE IF NOT EXISTS badminton_court_allotment (
      c_id INT AUTO_INCREMENT PRIMARY KEY,
      court_id INT,
      player1_id INT,
      player2_id INT,
      player3_id INT,
      player4_id INT,
      start_time DATETIME,
      end_time DATETIME,
      CONSTRAINT fk_court_id FOREIGN KEY (court_id) REFERENCES badminton_courts(court_id),
      CONSTRAINT fk_player1_id FOREIGN KEY (player1_id) REFERENCES students(s_id),
      CONSTRAINT fk_player2_id FOREIGN KEY (player2_id) REFERENCES students(s_id),
      CONSTRAINT fk_player3_id FOREIGN KEY (player3_id) REFERENCES students(s_id),
      CONSTRAINT fk_player4_id FOREIGN KEY (player4_id) REFERENCES students(s_id)
    )
  `;

  // Execute query for creating badminton court allotment table
  executeQuery(
    createBadmintonCourtAllotment,
    "Badminton court allotment table created successfully",
    "Error creating badminton court allotment table"
  );

  // Close the connection
  connection.end((err) => {
    if (err) {
      console.error("Error closing connection: " + err.stack);
      return;
    }
    console.log("Connection closed");
  });
}

// Function to execute SQL queries
function executeQuery(query, successMessage, errorMessage) {
  connection.query(query, (err, results) => {
    if (err) {
      console.error(errorMessage + ": " + err.stack);
      return;
    }
    console.log(successMessage);
  });
}
