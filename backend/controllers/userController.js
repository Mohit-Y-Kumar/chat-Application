const User = require("../models/User");

// @desc    Fetch all known users (for the online/offline sidebar)
// @route   GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("username isOnline lastSeen")
      .sort({ username: 1 })
      .lean();

    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers };