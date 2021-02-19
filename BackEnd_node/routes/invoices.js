const router = require("express").Router();
const { Invoice } = require("../models/Invoice");
const Doctor = require("../models/Specialist");
const Patient = require("../models/User");
const Appointment = require("../models/Appointment");

// create an invoice from specialist to customer

router.post("/", async function (req, res) {
  // fetch patient by id
  let patient = await Patient.User.findById(req.body.patientId);
  if (!patient)
    return res.json({
      error: true,
      status: "error",
      message: "could not find patient with this ID",
    });
  // fetch doctor by id
  let doctor = await Doctor.Specialist.findById(req.body.doctorId);
  if (!doctor)
    return res.json({
      error: true,
      status: "error",
      message: "could not find doctor with this ID",
    });
  // fetch doctor by id
  let appointment = await Appointment.Appointment.findById(
    req.body.appointmentId
  );
  if (!appointment)
    return res.json({
      error: true,
      status: "error",
      message: "could not find appointment with this ID",
    });

  const invoice = new Invoice(req.body);

  invoice.doctor.specialistId = doctor._id;
  invoice.doctor.firstname = doctor.firstname;
  invoice.doctor.lastname = doctor.lastname;
  invoice.doctor.email = doctor.email;
  invoice.doctor.expertise = doctor.expertise;
  invoice.doctor.image = doctor.image.imageURL;

  invoice.user.userId = patient._id;
  invoice.user.firstname = patient.firstname;
  invoice.user.lastname = patient.lastname;
  invoice.user.email = patient.email;
  invoice.user.image = patient.image.imageURL;

  //   await invoice.save()

  return res.json({
    error: false,
    status: "ok",
    message: "invoice delivered successfully",
    invoice,
  });
});

// get specialist' invoices

// get all customer's invoice

// cancel invoice and delete

//

module.exports = router;
