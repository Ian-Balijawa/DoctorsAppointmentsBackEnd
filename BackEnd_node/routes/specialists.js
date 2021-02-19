const fs = require("fs");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const config = require("config");
const router = require("express").Router();
const NodeGeocoder = require("node-geocoder");

const {
  comparePassword,
  Specialist,
  validateSpecialist,
} = require("../models/Specialist");
const { Expertise } = require("../models/Expertise");

// Find specialists near  (radius: 500m by default)
router.get("/nearby", async function (req, res) {
  try {
    let latitude = parseFloat(req.query.latitude);
    let longitude = parseFloat(req.query.longitude);
    let radius = parseInt(req.query.radius) || 500;

    const query = {
      location: {
        $near: {
          $maxDistance: radius,
          $minDistance: 0,
          $geometry: {
            type: "Point",
            coordinates: [latitude, longitude],
          },
        },
      },
    };

    const specialists = await Specialist.find(query);

    return res.json({
      error: false,
      status: "ok",
      results: specialists.length,
      specialists,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, status: "error", message: error.message });
  }
});

// search specialist by name
router.get("/search", async function (req, res) {
  let specialists = await Specialist.search(req.query.search);

  specialists = specialists.map((specialist) => {
    specialist.image.data = undefined;
    specialist.image.contentType = undefined;
    return specialist;
  });

  console.log(specialists);
  return res.json({
    error: false,
    status: "ok",
    results: specialists.length,
    specialists,
  });
});

// helper function to get location according to given address
const getLocation = async function (address) {
  const options = {
    provider: "mapquest",
    apiKey: config.get("geocodingMapquestApiKey"), // Mapquest API KEY
  };

  const geocoder = NodeGeocoder(options);
  const location = await geocoder.geocode(address);
  return location[0];
};

router.post(
  "/register",
  formidable({ keepExtensions: true }),
  async function (req, res) {
    try {
      let specialist = await Specialist.findOne({ email: req.fields.email });
      if (specialist)
        return res.status(400).json({
          error: true,
          status: "error",
          message: "Email already taken",
        });

      const expertise = await Expertise.findById(req.fields.expertiseId);
      if (!expertise)
        return res.status(400).json({
          error: true,
          status: "error",
          message: "Invalid expertise Id",
        });

      const { error } = validateSpecialist(req.fields);
      if (error)
        return res.status(404).json({
          error: true,
          status: "error",
          message: error.details[0].message,
        });

      specialist = new Specialist(req.fields);

      if (req.fields.expertiseId) {
        specialist.expertise.expertiseId = expertise._id;
        specialist.expertise.title = expertise.title;
        specialist.expertise.description = expertise.description;
        if (expertise.tags.length) {
          specialist.expertise.tags = expertise.tags;
        }
      }

      if (req.files.image) {
        let image = fs.readFileSync(req.files.image.path);
        specialist.image.data = image;
        specialist.image.contentType = req.files.image.type;
        specialist.image.imageURL = specialist.setImageUrl(
          req.files.image.name
        );
      }

      specialist.password = await specialist.hashPassword(specialist.password);
      const token = specialist.giveToken();

      if (req.fields.address) {
        location = await getLocation(req.fields.address);
        let streetName =
          location.streetName.length > 2
            ? location.streetName
            : req.fields.address;
        if (location) {
          (specialist.location.address = location.formattedAddress),
            (specialist.location.streetName = streetName),
            (specialist.location.coordinates = [
              location.latitude,
              location.longitude,
            ]);
        }
      }

      await specialist.save();

      specialist.password = undefined;
      specialist.image.data = undefined;
      specialist.image.contentType = undefined;

      return res.status(201).json({
        status: "ok",
        error: false,
        message: "doctor registered successfully",
        doctor: specialist,
        token,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: true, status: "error", message: error.message });
    }
  }
);

// login
router.post("/login", async function (req, res) {
  try {
    const { email, password } = req.body;
    let specialist = await Specialist.findOne({ email }).select("+password");

    if (!specialist)
      return res.status(404).json({
        status: "error",
        message: "Invalid email or password",
      });

    if (!(await comparePassword(password, specialist.password)))
      return res.status(404).json({
        status: "error",
        message: "Invalid password",
      });

    const token = specialist.giveToken();

    return res.status(200).json({
      error: false,
      status: "ok",
      doctor: specialist,
      token,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// router param middleware
router.param("doctorId", async function (req, res, next, doctorId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid doctor Id" });
    }

    const specialist = await Specialist.findById(doctorId);
    if (!specialist)
      return res
        .status(400)
        .json({ status: "error", message: "doctor with this id not found!" });

    next();
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// get all doctors
router.get("/", async function (req, res) {
  try {
    const specialists = await Specialist.find({});

    return res.status(200).json({
      error: false,
      status: "ok",
      results: specialists.length,
      doctors: specialists,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// get single doctor
router.get("/:doctorId", async function (req, res) {
  try {
    const specialist = await Specialist.findById(req.params.doctorId);

    return res.status(200).json({
      error: false,
      status: "ok",
      doctor: specialist,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// update doctor
router.patch("/:doctorId", async function (req, res) {
  try {
    const specialist = await Specialist.findByIdAndUpdate(
      req.body.doctorId,
      req.body,
      {
        new: true,
      }
    );

    return res.status(200).json({
      error: false,
      status: "ok",
      message: "doctor updated successfully",
      doctor: specialist,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// deleting a doctor
router.delete("/:doctorId", async function (req, res) {
  try {
    const specialist = await Specialist.findByIdAndRemove(req.params.doctorId);

    return res.status(200).json({
      error: false,
      status: "ok",
      message: "doctor deleted successfully",
      doctor: specialist,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, status: "error", message: error.message });
  }
});

// getting the image of the specialist
router.get("/images/:doctorId/*", async function (req, res) {
  const specialist = await Specialist.findById(req.params.doctorId).select(
    "+image.data +image.contentType"
  );

  res.set("content-type", specialist.image.contentType);
  res.send(specialist.image.data);
});

// storing specialist location and address
router.post("/location/:doctorId", async function (req, res) {
  try {
    const specialist = await Specialist.findById(req.params.doctorId);
    const location = await getLocation(req.body.address);
    specialist.location.address = location.formattedAddress;
    specialist.location.coordinates = [location.latitude, location.latitude];
    specialist.location.streetName = location.streetName;

    await specialist.save();
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, status: "error", message: error.message });
  }
});

module.exports = router;
