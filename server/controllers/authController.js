const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const publicUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  studentId: user.studentId,
  role: user.role,
  ecoPoints: user.ecoPoints,
  isActive: user.isActive,
});

const register = async (req, res, next) => {
  try {
    const { name, email, studentId, password } = req.body;
    if (!name || !email || !studentId || !password) {
      return res.status(400).json({ message: "Name, email, student ID and password are required." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must contain at least 6 characters." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedStudentId = String(studentId).trim();
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { studentId: normalizedStudentId }],
    });
    if (existing) return res.status(409).json({ message: "Email or student ID is already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      studentId: normalizedStudentId,
      password: hashedPassword,
      role: "student",
    });

    return res.status(201).json({
      message: "Account created successfully.",
      token: generateToken(user._id),
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Email or student ID is already registered." });
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    if (!user.isActive) return res.status(403).json({ message: "Your account has been deactivated. Contact the administrator." });

    return res.json({
      message: "Login successful.",
      token: generateToken(user._id),
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, publicUser };
