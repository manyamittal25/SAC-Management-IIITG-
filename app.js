const express = require("express");
const ejs = require("ejs");
const ejsMate = require("ejs-mate");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");

const {
  getAllStudents,
  getStudentById,
  getStudentByEmailPass,
  createStudent,
  updateStudent,
  deleteStudent,
} = require("./query/students");

const { getAllRooms,
getRoomById
 } = require("./query/rooms");

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
  if (userId == req.session.userId) {
    try {
      const user = await getStudentById(req.session.userId);
      const rooms = await getAllRooms(); // Assuming you have a function to fetch all rooms
      res.render("user/index", { user, rooms });
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
  const roomId = req.params.roomId;
  const room = await getRoomById(roomId);
  const user = await getStudentById(req.params.userId);
  if(room) {
    res.render("user/room_view", {user, room})
  }
})

const port = process.env.DB_PORT;
app.listen(port, () =>
  console.log(`Server is running on :- http://localhost:${port}`)
);