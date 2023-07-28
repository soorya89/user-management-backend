const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const verifyToken = require("../auth");
const multer = require("multer"); 

router.use(cookieParser());


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.get("/validateToken", async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, "secret");
    const userId = decodedToken.id;
    res.status(200).json({ auth: true, user: { id: userId } });
  } catch (error) {
    console.log(error);
    res.status(401).json({ auth: false });
  }
});

router.post("/login", async (req, res) => {
  console.log("Login request received");

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password); 

      if (passwordMatch) {
        const token = jwt.sign({ id: user._id }, "secret", { expiresIn: "1h" });
        const profilePicture = user.profilePicture;

        res.cookie("token", token, { maxAge: 3600000, httpOnly: true });
        res.status(200).json({ auth: true, token: token, user: user, profilePicture: profilePicture }); 
      } else {
        res.status(401).json({ auth: false, message: "Invalid password" });
      }
    } else {
      res.status(404).json({ auth: false, message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ auth: false, message: "Internal server error" });
  }
});


router.post("/register", upload.single("profilePicture"), async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });
    if (user) {
      res.status(409).json({ message: "User already registered" });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        profilePicture: req.file ? req.file.filename : null,
      });
      await newUser.save();
      res.status(201).json({ message: "Successfully registered" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "Protected route accessed" });
});

module.exports = router;
