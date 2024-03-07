const pool = require("./connect");

// Function to get all rooms
async function getAllAllotedRooms() {
  return new Promise((resolve, reject) => {
    const selectQuery = `SELECT * FROM room_allotment WHERE status='approved'`;
    pool.query(selectQuery, (err, results) => {
      if (err) {
        console.error("Error fetching allotment rooms: " + err.stack);
        return reject(err);
      }
      resolve(results);
    });
  });
}

// Function to get alloted rooms by room ID
async function getAllotedRoomsByRoomId(roomId) {
  return new Promise((resolve, reject) => {
    const selectQuery = ` SELECT name, r_name, start_time, end_time 
            FROM room_allotment NATURAL JOIN rooms NATURAL JOIN students 
            WHERE r_id = ? AND status = 'approved'
            `;
    pool.query(selectQuery, [roomId], (err, results) => {
      if (err) {
        console.error("Error fetching room_allot: " + err.stack);
        return reject(err);
      }
      if (results.length === 0) {
        console.error("room_allot not found");
        return reject(new Error("room_allot not found"));
      }
      resolve(results);
    });
  });
}

// Function to get overlapping interval
async function getOverlappingInterval(startTime, endTime, roomId) {
  return new Promise((resolve, reject) => {
    const selectQuery = `
            SELECT COUNT(*) AS overlapCount
            FROM room_allotment 
            WHERE r_id = ? 
            AND status = 'approved' 
            AND ((start_time BETWEEN ? AND ?) OR (end_time BETWEEN ? AND ?))
        `;
    pool.query(
      selectQuery,
      [roomId, startTime, endTime, startTime, endTime],
      (err, results) => {
        if (err) {
          console.error("Error fetching overlapping interval: " + err.stack);
          return reject(err);
        }
        resolve(results);
      }
    );
  });
}

async function createRoomAllotment(
  userId,
  roomId,
  startTime,
  endTime,
  description
) {
  return new Promise((resolve, reject) => {
    const insertQuery = `INSERT INTO room_allotment (s_id, r_id, start_time, end_time, description, status) VALUES (?, ?, ?, ?, ?, 'approved')`;
    pool.query(
      insertQuery,
      [userId, roomId, startTime, endTime, description],
      (err, results) => {
        if (err) {
          console.error("Error creating room allotment: " + err.stack);
          return reject(err);
        }
        resolve(results.insertId);
      }
    );
  });
}

module.exports = {
  getAllAllotedRooms,
  getAllotedRoomsByRoomId,
  getOverlappingInterval,
  createRoomAllotment,
};
