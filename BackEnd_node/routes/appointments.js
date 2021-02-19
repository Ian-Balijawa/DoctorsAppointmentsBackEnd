const router = require("express").Router();
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Specialist");
const Patient = require("../models/User");

// get all appointments for a patient
router.get("/patients/:patientId", async function (req, res) {
  const appointments = await Appointment.Appointment.find({
    "user.userId": req.params.patientId,
  });

  return res.json({
    error: false,
    status: "ok",
    results: appointments.length,
    appointments,
  });
});

// get single appointment
router.get("/patients/:patientId/:appointmentId", async function (req, res) {});

// create appointment
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

  const appointment = Appointment.Appointment(req.body);

  appointment.specialist.specialistId = doctor._id;
  appointment.specialist.firstname = doctor.firstname;
  appointment.specialist.lastname = doctor.lastname;
  appointment.specialist.email = doctor.email;
  appointment.specialist.expertise = doctor.expertise.title;
  appointment.specialist.image = doctor.image.imageURL;
  appointment.specialist.location = {
    coordinates: doctor.location.coordinates,
    address: doctor.location.address,
    streetName: doctor.location.streetName,
  };

  appointment.user.userId = patient._id;
  appointment.user.firstname = patient.firstname;
  appointment.user.lastname = patient.lastname;
  appointment.user.email = patient.email;
  appointment.user.image = patient.image.imageURL;

  await appointment.save();

  return res.json({
    error: false,
    status: "ok",
    message: "successfully created appointment!",
    appointment,
  });
});

// get appointments where appointment status is pending
router.get("/seen/patients/:patientId", async function (req, res) {
  try {
    const seenAppointments = await Appointment.Appointment.find({
      "user.userId": req.params.patientId,
      status: "seen",
    });

    return res.json({
      error: false,
      status: "ok",
      results: seenAppointments.length,
      appointments: seenAppointments,
    });
  } catch (error) {
    return res.json({
      error: true,
      status: "error",
      message: error.message,
    });
  }
});

module.exports = router;
