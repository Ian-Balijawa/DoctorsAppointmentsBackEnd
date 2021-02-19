const Joi = require("joi");
const mongoose = require("mongoose");

const expertiseSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String },
  tags: { type: [String] },
});

function validateExpertise(expertise) {
  const schema = Joi.object().keys({
    title: Joi.string().required().trim().label("Title"),
    description: Joi.string().required().trim().label("Description"),
  });

  return schema.validate(expertise);
}

const Expertise = mongoose.model("Expertise", expertiseSchema);

module.exports = {
  Expertise,
  expertiseSchema,
  validateExpertise,
};
