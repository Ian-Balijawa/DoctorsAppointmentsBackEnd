const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      firstname: { type: String },
      lastname: { type: String },
      email: { type: String },
      image: { type: String },
    },
    specialist: {
      specialistId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      firstname: { type: String },
      lastname: { type: String },
      email: { type: String },
      expertise: { type: String },
      image: { type: String },
      location: { type: Object },
    },
    reason: { type: String },
    emergency: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "finished", "seen", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = {
  Appointment,
  appointmentSchema,
};
