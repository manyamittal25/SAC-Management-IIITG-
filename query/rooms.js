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

module.exports = {
  getAllRooms
};
