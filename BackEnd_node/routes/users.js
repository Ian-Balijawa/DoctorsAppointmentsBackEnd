const fs = require("fs");
const router = require("express").Router();
const formidable = require("express-formidable");
const mongoose = require("mongoose");

const { User, validateUser, comparePassword } = require("../models/User");

// register user
router.post(
  "/register",
  formidable({ keepExtensions: true }),
  async function (req, res) {
    try {
      let user = await User.findOne({ email: req.fields.email });
      if (user)
        return res.status(400).json({
          status: "error",
          error: true,
          message: "Email already taken",
        });

      const { error } = validateUser(req.fields);
      if (error)
        return res.status(404).json({
          status: "error",
          error: true,
          message: error.details[0].message,
        });
      user = new User(req.fields);
      if (req.files.image) {
        let image = fs.readFileSync(req.files.image.path);
        user.image.data = image;
        user.image.contentType = req.files.image.type;
        user.image.imageURL = user.setImageUrl(req.files.image.name);
      }

      user.password = await user.hashPassword(user.password);
      const token = user.giveToken();

      await user.save();

      user.password = undefined;
      user.image.data = undefined;
      user.image.contentType = undefined;

      return res.status(201).json({
        status: "ok",
        error: false,
        message: "user registered successfully",
        user,
        token,
      });
    } catch (error) {
      return res.status(500).json({ status: "error", message: error.message });
    }
  }
);

// login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email }).select("+password");

    if (!user)
      return res.status(404).json({
        status: "error",
        message: "Invalid email or password",
      });

    if (!(await comparePassword(password, user.password)))
      return res.status(404).json({
        status: "error",
        message: "Invalid password",
      });

    const token = user.giveToken();

    return res.status(200).json({
      status: "ok",
      error: false,
      message: "user logged in successfully",
      user,
      token,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// router param middleware
router.param("userId", async (req, res, next, userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid user Id" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(400)
        .json({ status: "error", message: "User with this id not found!" });

    next();
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({});

    return res.status(200).json({
      error: false,
      status: "ok",
      results: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// get single user
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    return res.status(200).json({
      error: false,
      status: "ok",
      user,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// update user
router.patch("/:userId", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.body.userId, req.body, {
      new: true,
    });

    return res.status(200).json({
      error: false,
      status: "ok",
      message: "user updated successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// update user image

// delete user
router.delete("/:userId", async (req, res) => {
  try {
    const user = await User.findByIdAndRemove(req.params.userId);

    return res.status(200).json({
      error: false,
      status: "ok",
      message: "user deleted successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/images/:userId/*", async (req, res) => {
  const user = await User.findById(req.params.userId).select(
    "+image.data +image.contentType"
  );

  res.set("content-type", user.image.contentType);
  res.send(user.image.data);
});

// user image upload
router.post(
  "/images/:userId/",
  formidable({ keepExtensions: true }),
  async (req, res) => {
    const image = fs.readFileSync(req.files.image.path);
    const user = await User.findById(req.params.userId).select(
      "+image.data +image.contentType"
    );

    user.image.data = image;
    user.image.contentType = req.files.image.type;
    user.image.imageURL = user.setImageUrl(req.files.image.name);

    await user.save();
  }
);

// update user image
router.patch(
  "/images/:userId/",
  formidable({ keepExtensions: true }),
  async (req, res) => {}
);

module.exports = router;
