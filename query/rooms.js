const pool = require("./connect");

// Function to get all rooms
async function getAllRooms() {
  return new Promise((resolve, reject) => {
    const selectQuery = `SELECT * FROM rooms`;
    pool.query(selectQuery, (err, results) => {
      if (err) {
        console.error("Error fetching rooms: " + err.stack);
        return reject(err);
      }
      resolve(results);
    });
  });
}

async function getRoomById(roomId) {
  return new Promise((resolve, reject) => {
    const selectQuery = `SELECT * FROM rooms WHERE r_id = ?`;
    pool.query(selectQuery, [roomId], (err, results) => {
      if (err) {
        console.error("Error fetching room: " + err.stack);
        return reject(err);
      }
      if (results.length === 0) {
        console.error("Room not found");
        return reject(new Error("Room not found"));
      }
      resolve(results[0]);
    });
  });
}

// Function to create a room
async function createRoom(roomData) {
  return new Promise((resolve, reject) => {
    const { r_name } = roomData;
    console.log("Room data", roomData);
    const insertQuery = `INSERT INTO rooms (r_name) VALUES (?)`;
    pool.query(insertQuery, [r_name], (err, results) => {
      if (err) {
        console.error("Error creating room: " + err.stack);
        return reject(err);
      }
      console.log("room created successfully");
      const roomId = results.insertId; // Get the ID of the newly created room
      getRoomById(roomId)
        .then((room) => {
          resolve(room);
        })
        .catch((err) => {
          reject(err);
        });
    });
  });
}

async function deleteRoom(roomId) {
  return new Promise((resolve, reject) => {
    const deleteQuery = `DELETE FROM rooms WHERE r_id = ?`;
    pool.query(deleteQuery, [roomId], (err, results) => {
      if (err) {
        console.error("Error deleting room: " + err.stack);
        return reject(err);
      }
      console.log("Room deleted successfully");
      resolve(results.affectedRows > 0); // Resolve with a boolean indicating whether a room was deleted
    });
  });
}

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  deleteRoom,
};