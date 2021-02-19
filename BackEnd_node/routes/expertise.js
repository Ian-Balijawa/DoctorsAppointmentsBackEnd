const router = require("express").Router();
const mongoose = require("mongoose");
const { Expertise, validateExpertise } = require("../models/Expertise");

// router param middleware
router.param("expertiseId", async (req, res, next, expertiseId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(expertiseId)) {
      return res.status(400).json({
        error: true,
        status: "error",
        message: "Invalid expertise Id",
      });
    }

    const expertise = await Expertise.findById(expertiseId);
    if (!expertise)
      return res.status(400).json({
        error: true,
        status: "error",
        message: "expertise with this id not found!",
      });

    next();
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, status: "error", message: error.message });
  }
});

// get all expertises
router.get("/", async (req, res) => {
  try {
    const expertise = await Expertise.find({});

    return res.status(200).json({
      error: false,
      status: "ok",
      results: expertise.length,
      expertise,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, status: "error", message: error.message });
  }
});

// get single expertise
router.get("/:expertiseId", async (req, res) => {
  try {
    const expertise = await Expertise.findById(req.params.expertiseId);

    return res.status(200).json({
      error: false,
      status: "ok",
      expertise,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// create expertise
router.post("/", async (req, res) => {
  try {
    const { title, description } = req.body;

    let expertise = await Expertise.findOne({ title });
    if (expertise)
      return res.json({
        error: true,
        status: "error",
        message: "Expertise with this title already exists",
      });

    const { error } = validateExpertise({ title, description });
    if (error)
      return res.json({
        error: true,
        status: "error",
        message: error.details[0].message,
      });

    expertise = new Expertise(req.body);
    if (req.body.tags) {
      const tags = req.body.tags.split(", ");
      expertise.tags = tags;
    }

    await expertise.save();

    return res.status(201).json({
      status: "ok",
      message: "expertise created successfully",
      data: {
        expertise,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// delete expertise
router.delete("/:expertiseId", async (req, res) => {
  try {
    const expertise = await Expertise.findByIdAndRemove(req.params.expertiseId);

    return res.status(200).json({
      status: "ok",
      message: "expertise deleted successfully",
      data: {
        expertise,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// update a expertise
router.patch("/:expertiseId", async (req, res) => {
  try {
    const expertise = await Expertise.findByIdAndUpdate(
      req.body.expertiseId,
      req.body,
      { new: true }
    );

    return res.status(200).json({
      status: "ok",
      message: "expertise updated successfully",
      data: {
        expertise,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
