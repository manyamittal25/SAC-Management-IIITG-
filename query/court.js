const pool = require("./connect");

// Function to check if any player overlaps in the specified time slot for a specific court
async function checkOverlap(courtId, startTime, endTime) {
    return new Promise((resolve, reject) => {
        const selectQuery = `
            SELECT COUNT(*) AS overlap_count
            FROM badminton_court_allotment
            WHERE court_id = ?
            AND (
                (start_time < ? AND end_time > ?)
                OR (start_time < ? AND end_time > ?)
                OR (start_time >= ? AND end_time <= ?)
            )
        `;
    

        const values = [courtId, endTime, endTime, startTime, startTime, startTime, endTime];

        pool.query(selectQuery, values, (err, results) => {
            if (err) {
                console.error("Error checking overlap: " + err.stack);
                return reject(err);
            }
            const overlapCount = results[0].overlap_count;
            resolve(overlapCount > 0);
        });
    });
}

// Function to insert data into the badminton_court_allotment table
async function insertBadmintonCourtAllotment(courtId, player1Id, player2Id, player3Id, player4Id, startTime, endTime) {

    // Check for overlap before insertion
    const isOverlap = await checkOverlap(courtId, startTime, endTime);
    if (isOverlap) {
        throw new Error("Overlap detected. Players are already allotted for the specified time slot.");
    }

    // Perform insertion if no overlap
    return new Promise((resolve, reject) => {
        const insertQuery = `
            INSERT INTO badminton_court_allotment 
            (court_id, player1_id, player2_id, player3_id, player4_id, start_time, end_time) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [courtId, player1Id, player2Id, player3Id, player4Id, startTime, endTime];

        pool.query(insertQuery, values, (err, result) => {
            if (err) {
                console.error("Error inserting data into badminton_court_allotment table: " + err.stack);
                return reject(err);
            }
            console.log("Inserted into badminton_court_allotment table successfully");
            resolve(result);
        });
    });
}


module.exports = { insertBadmintonCourtAllotment };
