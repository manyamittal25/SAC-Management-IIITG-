const express = require("express");
const ejs = require("ejs");
const ejsMate = require("ejs-mate");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const moment = require("moment");

const {
  getAllStudents,
  getStudentById,
  getStudentByEmailPass,
  createStudent,
  updateStudent,
  deleteStudent,
} = require("./query/students");

const { getAllRooms, getRoomById } = require("./query/rooms");

const {
  getAllAllotedRooms,
  getAllotedRoomsByRoomId,
  getAllotedRoomsByUserId,
  getOverlappingInterval,
  createRoomAllotment,
} = require("./query/room_allot");

const app = express();

app.engine("ejs", ejsMate); // Set ejsMate as the view engine
app.set("view engine", "ejs"); // Set EJS as the view engine

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from the 'public' directory
// Set up session middleware
app.use(
  session({
    secret: "secret", // Change this to a secure random string in production
    resave: false,
    saveUninitialized: true,
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
    const existingUser = await getStudentByEmailPass(email, roll, password);
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
  const currentPage = 'home'
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
    const currentPage = 'home'
    if (room_allotments) {
      res.render("user/room_view", { user, room, room_allotments, currentPage });
    } else {
      res.send("no allotment");
    }
  } catch (error) {
    console.error("Error rendering room view:", error);
    res.status(500).send("Internal Server Error");
  }
});

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
    return res
      .status(400)
      .send("Start time should be within the next 7 days.");
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

app.get("/user/:userId/room/:roomId/allot", requireAuth, async (req, res) => {
  const roomId = req.params.roomId;
  const room = await getRoomById(roomId);
  const user = await getStudentById(req.params.userId);
  const currentPage = 'home'

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

      // Check for overlapping intervals
      const countOverlapping = await getOverlappingInterval(
        start_time,
        end_time,
        req.params.roomId
      );
      console.dir(countOverlapping);
      // If there are no overlapping intervals, create the room allotment
      if (countOverlapping[0].overlapCount == 0) {
        await createRoomAllotment(
          req.params.userId,
          req.params.roomId,
          start_time,
          end_time,
          description
        );
        res.redirect(`/user/${req.params.userId}/room/${req.params.roomId}`);
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
    const room_allotments = await getAllotedRoomsByUserId(req.params.userId);
    const currentPage = 'history'
    if (room_allotments) {
      res.render("user/room_history", { user, room_allotments, currentPage });
    } else {
      res.send("no allotment");
    }
  } catch (error) {
    console.error("Error rendering history view:", error);
    res.status(500).send("Internal Server Error");
  }
})

app.get("/admin", (req, res) => {
  res.render("admin/login");
});

app.post("/admin", (req, res) => {
  const { admin_name, admin_password } = req.body;
  if (admin_name === "nanmo" && admin_password === "abc") {
    return res.redirect("/admin/dashboard");
  } else {
    return res.send("Incorrect username or password.");
  }
});

app.get("/admin/dashboard", async (req, res) => {
  const rooms = await getAllRooms();
  res.render("admin/index", { rooms });
});

app.get("/room/:roomId/allot", async (req, res) => {
  const room_allotment = await getAllotedRoomsByRoomId(req.params.roomId);
  res.send(room_allotment);
});



const port = process.env.DB_PORT;
app.listen(port, () =>
  console.log(`Server is running on :- http://localhost:${port}`)
);
