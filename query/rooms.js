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

module.exports = {
  getAllRooms,
  getRoomById
};
