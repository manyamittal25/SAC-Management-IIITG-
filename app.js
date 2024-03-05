const express = require("express");
const ejs = require("ejs");
const ejsMate = require("ejs-mate");
const bodyParser = require("body-parser");

const {
  getAllStudents,
  getStudentById,
  getStudentByEmailPass,
  createStudent,
  updateStudent,
  deleteStudent,
} = require("./query/students");

const app = express();

app.engine("ejs", ejsMate); // Set ejsMate as the view engine
app.set("view engine", "ejs"); // Set EJS as the view engine

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
      return res
        .status(401)
        .send({ status: false, message: "Invalid Credentials" });
    }
    console.log(user);
    return res.status(200).send({ status: true, data: user });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ status: false, message: "Internal Server Error" });
  }
});

// GET route for rendering the sign up form
app.get("/signUp", (req, res) => {
  res.render("user/signUp"); // Render the sign up template
});

// POST route for handling sign up form submission
app.post("/signUp", async (req, res) => {
  const { name, roll, email, password } = req.body;
  try {
    // Check if the user already exists (you may need to implement this logic)
    const existingUser = await getStudentByEmailPass(email, roll, password);
    if (existingUser) {
      return res
        .status(400)
        .send({ status: false, message: "User already exists" });
    }
    // If the user doesn't exist, create a new user
    const user = await createStudent({ name, roll, email, password });
    return res
      .status(201)
      .send({ status: true, message: "User created successfully", user });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ status: false, message: "Internal Server Error" });
  }
});

const port = 3001;
app.listen(port, () =>
  console.log(`Server is running on :- http://localhost:${port}`)
);