const mongoose = require("mongoose");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");
const searchable = require("mongoose-regex-search");

const specialistSchema = new mongoose.Schema({
  firstname: { type: String, searchable: true },
  lastname: { type: String, searchable: true },
  fullname: { type: String, searchable: true },
  about: { type: String, searchable: true },
  email: { type: String, unique: true },
  password: { type: String, select: false },
  phone: { type: String },
  experience: { type: Number },
  expertise: {
    expertiseId: { type: mongoose.Schema.Types.ObjectId },
    title: { type: String, searchable: true },
    description: { type: String, searchable: true },
    tags: { type: Array, searchable: true },
  },
  rating: { type: Number },
  image: {
    data: { type: Buffer, select: false },
    imageURL: String,
    contentType: { type: String, select: false },
  },
  location: {
    type: {
      type: String,
      default: "Point",
    },
    coordinates: {
      type: [Number],
      index: "2dsphere",
    },
    address: { type: String },
    streetName: { type: String },
  },
});

function validateSpecialist(specialist) {
  const schema = Joi.object().keys({
    firstname: Joi.string().required().trim().label("First name"),
    lastname: Joi.string().required().trim().label("Last name"),
    fullname: Joi.string().optional().trim().label("Full name"),
    about: Joi.string().optional().trim().label("About"),
    email: Joi.string().required().trim().label("Email"),
    password: Joi.string().required().trim().label("Password"),
    phone: Joi.string().required().trim().label("Phone number"),
    experience: Joi.string().required().trim().label("Experience"),
    expertiseId: Joi.string().required().trim().label("Expertise"),
    rating: Joi.number().label("Rating"),
    address: Joi.string().trim().label("Address"),
    location: Joi.object().label("Location"),
  });

  return schema.validate(specialist);
}

specialistSchema.plugin(searchable);
specialistSchema.index({ location: "2dsphere" });

specialistSchema.pre("save", function () {
  this.fullname = `${this.firstname} ${this.lastname}`;
});

async function comparePassword(password, hashedPassword) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    return error;
  }
}

specialistSchema.methods.hashPassword = async function (password) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    return error;
  }
};

specialistSchema.methods.giveToken = function () {
  return jwt.sign({ _id: this._id }, "secret");
};

specialistSchema.methods.setImageUrl = function (image_name) {
  let image_url = `${config.get("baseURL")}/specialists/images/${
    this._id
  }/${image_name}`;
  return image_url;
};

const Specialist = mongoose.model("Specialist", specialistSchema);

module.exports = {
  comparePassword,
  Specialist,
  userSchema: specialistSchema,
  validateSpecialist,
};
