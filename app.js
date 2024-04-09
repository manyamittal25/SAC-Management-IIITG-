const express = require("express");
const ejs = require("ejs");
const ejsMate = require("ejs-mate");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const moment = require("moment");
const { parse } = require("date-fns");

const {
  getAllStudents,
  getStudentById,
  getUserByEmail,
  getStudentByEmailPass,
  getStudentByEmailRollPass,
  createStudent,
  updateStudent,
  deleteStudent,
} = require("./query/students");

const {
  getAllRooms,
  getRoomById,
  createRoom,
  deleteRoom,
} = require("./query/rooms");

const {
  getAllAllotedRooms,
  getAllotedRoomsByRoomId,
  getAllAllotedRoomsByRoomId,
  getAllotedRoomsByUserId,
  getOverlappingInterval,
  createRoomAllotment,
  approveRoomAllotment,
  getHisAllotedRoomsByUserId,
} = require("./query/room_allot");

const { insertBadmintonCourtAllotment } = require("./query/court");

const app = express();

app.engine("ejs", ejsMate); // Set ejsMate as the view engine
app.set("view engine", "ejs"); // Set EJS as the view engine

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from the 'public' directory
app.use(
  session({
    secret: "secret", 
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      // Other cookie options such as secure, httpOnly, etc. can also be set here
    }
  })
);

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.userId) {
    // If user is authenticated
    next();
  } else {
    res.redirect("/login");
  }
}

// Authentication middleware
function requireAuthAdmin(req, res, next) {
  if (req.session.adminId) {
    // If user is authenticated
    next();
  } else {
    res.redirect("/admin");
  }
}

// Middleware to validate the start time and end time
const validateRoomAllotment = (req, res, next) => {
  const { start_time, end_time } = req.body;

  // Convert start_time and end_time to Date objects
  const startTime = moment(start_time);
  const endTime = moment(end_time);

  // Check if start_time and end_time are valid
  if (!startTime.isValid() || !endTime.isValid()) {
    return res.status(400).send("Invalid start time or end time.");
  }

  // Check if start_time is within the next 7 days
  if (!startTime.isBetween(moment(), moment().add(7 * 24, "hours"))) {
    return res.status(400).send("Start time should be within the next 7 days.");
  }

  // Calculate duration in hours
  const duration = moment.duration(endTime.diff(startTime)).asHours();

  // Check if duration is less than or equal to 3 hours
  if (duration > 3) {
    return res
      .status(400)
      .send("Duration should be less than or equal to 3 hours.");
  }

  // Proceed to the next middleware if validation passes
  next();
};

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("user/login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await getStudentByEmailPass(email, password);
    if (!user) {
      return res.render("user/login", { error: "Invalid Credentials" });
    }
    req.session.userId = user.s_id; // Store user ID in session
    res.redirect(`/user/${user.s_id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// GET route for rendering the sign up form
app.get("/signUp", (req, res) => {
  res.render("user/login"); // Render the sign up template
});

app.post("/signUp", async (req, res) => {
  const { name, roll, email, password } = req.body;
  try {
    const existingUser = await getStudentByEmailRollPass(email, roll);
    console.log(existingUser);
    if (existingUser) {
      return res.render("user/login", { error: "User already exists" });
    }
    const user = await createStudent({ name, roll, email, password });
    req.session.userId = user.s_id; // Store user ID in session
    res.redirect(`/user/${user.s_id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// User profile route (requires authentication)
app.get("/user/:userId", requireAuth, async (req, res) => {
  const userId = req.params.userId;
  const currentPage = "home";
  if (userId == req.session.userId) {
    try {
      const user = await getStudentById(req.session.userId);
      const rooms = await getAllRooms(); // Assuming you have a function to fetch all rooms
      const booking = await getAllotedRoomsByUserId(userId);
      res.render("user/index", { user, rooms, currentPage, booking });
      console.dir(user);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/user/:userId/room/:roomId", requireAuth, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const room = await getRoomById(roomId);
    const user = await getStudentById(req.params.userId);
    const room_allotments = await getAllotedRoomsByRoomId(req.params.roomId);
    const currentPage = "home";
    if (room_allotments) {
      res.render("user/room_view", {
        user,
        room,
        room_allotments,
        currentPage,
      });
    } else {
      res.send("no allotment");
    }
  } catch (error) {
    console.error("Error rendering room view:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/user/:userId/room/:roomId/allot", requireAuth, async (req, res) => {
  const roomId = req.params.roomId;
  const room = await getRoomById(roomId);
  const user = await getStudentById(req.params.userId);
  const currentPage = "home";

  if (room) {
    res.render("user/room_allocate", { user, room, currentPage });
  }
});
// Route handler for POST request
app.post(
  "/user/:userId/room/:roomId/allot",
  requireAuth,
  validateRoomAllotment,
  async (req, res) => {
    try {
      const { start_time, end_time, description } = req.body;

      // Validate end_time greater than start_time
      if (new Date(end_time) <= new Date(start_time)) {
        return res.status(400).json({ error: "End time must be greater than start time" });
      }
      
      // Check for overlapping intervals
      const countOverlapping = await getOverlappingInterval(
        start_time,
        end_time,
        req.params.roomId
      );
      
      // If there are no overlapping intervals, create the room allotment
      if (countOverlapping[0].overlapCount == 0) {
        await createRoomAllotment(
          req.params.userId,
          req.params.roomId,
          start_time,
          end_time,
          description
        );
        res.redirect(`/user/${req.params.userId}`);
      } else {
        res
          .status(409)
          .json({ error: "Room allotment overlaps with existing bookings" });
      }
    } catch (error) {
      console.error("Error creating room allotment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
app.get("/user/:userId/history", async (req, res) => {
  try {
    const user = await getStudentById(req.params.userId);
    const room_allotments = await getHisAllotedRoomsByUserId(req.params.userId);
    const currentPage = "history";
    if (room_allotments) {
      res.render("user/room_history", { user, room_allotments, currentPage });
    } else {
      res.send("no allotment");
    }
  } catch (error) {
    console.error("Error rendering history view:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/user/:userId/bookcourt", async (req, res) => {
  const user = await getStudentById(req.params.userId);
  const currentPage = "bookCourt";
  res.render("user/bookCourt", { user, currentPage });
});

app.post("/user/:userId/bookcourt", async (req, res) => {
  try {
    const inputDate = req.body.date;
    const inputTime = req.body.time;

    const { court_id, email1, email2, email3, email4 } = req.body;

    const [startTimeString, endTimeString] = inputTime.split("-");

    const startDateTimeString = `${inputDate} ${startTimeString}`;
    const endDateTimeString = `${inputDate} ${endTimeString}`;

    const startTime = parse(
      startDateTimeString,
      "yyyy-MM-dd HH:mm",
      new Date()
    );
    const endTime = parse(endDateTimeString, "yyyy-MM-dd HH:mm", new Date());

    const player1Id = await getUserByEmail(email1);
    const player2Id = await getUserByEmail(email2);
    const player3Id = await getUserByEmail(email3);
    const player4Id = await getUserByEmail(email4);
    if (player1Id && player2Id && player3Id && player4Id) {
      const bookBadmintonCourt = await insertBadmintonCourtAllotment(
        court_id,
        player1Id.s_id,
        player2Id.s_id,
        player3Id.s_id,
        player4Id.s_id,
        startTime,
        endTime
      );
      res.redirect(`/user/${req.params.userId}`);
    } else {
      res.redirect(`/user/${req.params.userId}/bookcourt`);
    }
  } catch (error) {
      console.error("Error booking badminton court:", error);
      res.status(500).send("An error occurred while booking the badminton court: " + error.message);
    }
});

app.get("/user/:userId/setting", async(req, res) => {
  const user = await getStudentById(req.params.userId);
  const currentPage = "setting"
  res.render("user/setting", {user, currentPage});
})

app.post("/user/:userId/edit", async(req, res) => {
  await updateStudent(req.params.userId, req.body);
  res.redirect(`/user/${req.params.userId}/setting`)
})

app.post("/user/:userId/logout", requireAuth, async (req, res) => {
  const userId = req.params.userId;

  if (userId == req.session.userId) {
    try {
      // Clear the user's session or authentication token
      req.session.destroy();

      // Optionally, you can redirect the user to the login page
      return res.redirect('/login');
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/admin", (req, res) => {
  res.render("admin/login");
});

app.post("/admin", (req, res) => {
  const { admin_name, admin_password } = req.body;
  if (admin_name === "nanmo" && admin_password === "abc") {
    req.session.adminId = 1;
    return res.redirect("/admin/dashboard");
  } else {
    return res.send("Incorrect username or password.");
  }
});

app.get("/admin/dashboard", requireAuthAdmin, async (req, res) => {
  if (req.session.adminId == 1) {
    const rooms = await getAllRooms();
    res.render("admin/index", { rooms });
  } else {
    res.redirect("/admin");
  }
});

app.get("/admin/dashboard/view/:roomId", async (req, res) => {
  const roomId = req.params.roomId;
  const rooms = await getAllAllotedRoomsByRoomId(roomId);
  console.log(rooms);
  res.render("admin/viewRoom", { rooms, roomId });
});

app.get("/admin/dashboard/addRoom", requireAuthAdmin, async (req, res) => {
  res.render("admin/addRoom");
});

app.post("/admin/dashboard/addRoom", async (req, res) => {
  try {
    // Extracting data from the request body
    const { r_name } = req.body;
    const newRoom = await createRoom({ r_name });

    res.redirect("/admin/dashboard");
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error adding room:", error);
    res
      .status(500)
      .json({ message: "Error adding room", error: error.message });
  }
});

app.post("/admin/dashboard/delete/:roomId", async (req, res) => {
  const roomId = req.params.roomId;

  try {
    // Call a function to delete the room by its ID
    const check = await deleteRoom(roomId);
    if (check) {
      res.redirect("/admin/dashboard");
    } else {
      console.log("not deteted");
    }
  } catch (error) {
    // If an error occurs during deletion, handle it appropriately
    console.error("Error deleting room:", error);
    res.status(500).send("Error deleting room. Please try again later.");
  }
});

app.get("/room/:roomId/allot", async (req, res) => {
  const room_allotment = await getAllotedRoomsByRoomId(req.params.roomId);
  res.send(room_allotment);
});

function convertToDatetimeLocal(dateTimeString) {
  const date = new Date(dateTimeString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

app.post("/approve/:roomId", async (req, res) => {
  try {
    const { a_id, start_time, end_time, r_id } = req.body;
    const new_start_time = convertToDatetimeLocal(start_time);
    const new_end_time = convertToDatetimeLocal(end_time);
    const countOverlapping = await getOverlappingInterval(
      new_start_time,
      new_end_time,
      r_id
    );
    if (countOverlapping[0].overlapCount == 0) {
      const conformBooking = await approveRoomAllotment(a_id);
      if (conformBooking) {
        res.redirect(`/admin/dashboard/view/${req.params.roomId}`);
      } else {
        res.status(500).send("Failed to approve room allotment.");
      }
    } else {
      res
        .status(400)
        .send(
          "There is an overlapping interval. Room allotment cannot be approved."
        );
    }
  } catch (error) {
    console.error("Error while approving room allotment: " + error.stack);
    res.status(500).send("An error occurred while processing your request.");
  }
});

const port = process.env.DB_PORT;
app.listen(port, () =>
  console.log(`Server is running on :- http://localhost:${port}`)
);
