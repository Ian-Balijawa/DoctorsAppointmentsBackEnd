const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      userId: { type: mongoose.SchemaTypes.ObjectId },
      email: { type: String },
      phone: { type: String },
    },
    doctor: {
      doctorId: { type: mongoose.SchemaTypes.ObjectId },
      email: { type: String },
      phone: { type: String },
    },
    appointmentId: { type: mongoose.SchemaTypes.ObjectId },
    status: {
      type: String,
      enum: ["unseen", "seen", "declined", "accepted"],
      default: "unseen",
    },
    proposedDatetime: { type: Date },
    fee: { type: Number },
  },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = {
  Invoice,
  invoiceSchema,
};
