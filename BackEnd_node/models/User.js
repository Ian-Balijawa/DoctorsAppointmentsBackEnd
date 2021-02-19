const mongoose = require("mongoose");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");

const userSchema = new mongoose.Schema({
  firstname: { type: String },
  lastname: { type: String },
  email: { type: String, unique: true },
  password: { type: String, select: false },
  phone: { type: String },
  image: {
    data: { type: Buffer, select: false },
    imageURL: String,
    contentType: { type: String, select: false },
  },
});

function validateUser(user) {
  const schema = Joi.object().keys({
    firstname: Joi.string().required().trim().label("First name"),
    lastname: Joi.string().required().trim().label("Last name"),
    email: Joi.string().required().trim().label("Email"),
    password: Joi.string().required().trim().label("Password"),
    phone: Joi.string().required().trim().label("Phone number"),
  });

  return schema.validate(user);
}

async function comparePassword(password, hashedPassword) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    return error;
  }
}

userSchema.methods.hashPassword = async function (password) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    return error;
  }
};

userSchema.methods.giveToken = function () {
  return jwt.sign({ _id: this._id }, "secret");
};

userSchema.methods.setImageUrl = function (image_name) {
  let image_url = `${config.get("baseURL")}/users/images/${
    this._id
  }/${image_name}`;
  return image_url;
};

const User = mongoose.model("User", userSchema);

module.exports = {
  User,
  userSchema,
  validateUser,
  comparePassword,
};
