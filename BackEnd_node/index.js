const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const config = require("config");
const winston = require("winston");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");

// importing route handlers
const userRouter = require("./routes/users");
const expertiseRouter = require("./routes/expertise");
const specialistRouter = require("./routes/specialists");
const appointmentRouter = require("./routes/appointments");
const invoiceRouter = require("./routes/invoices");

const app = express();

// configuring winston for logging services
winston.add(new winston.transports.Console({ level: "info" }));

// handling uncaught exceptions and rejected promises
process.on("uncaughtException", (ex) => {
  winston.error(ex.message);
  process.exit(1);
});
process.on("unhandledRejection", (ex) => {
  throw ex;
});

// database configurations
mongoose.connect(
  config.get("databaseURI"),
  {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (error) => {
    if (error) {
      winston.error(error.message);
      process.exit(1);
    }
    winston.info("database connected  ___");
  }
);

// middlewares

// use helmet and compression for production
if (!(app.get("env") === "development")) app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (!(app.get("env") === "development")) app.use(compression());
if (app.get("env") === "development") app.use(morgan("dev"));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Credentials", "*");
  next();
});

// routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/expertise", expertiseRouter);
app.use("/api/v1/specialists", specialistRouter);
app.use("/api/v1/appointments", appointmentRouter);
app.use("/api/v1/invoices", invoiceRouter);

// server config
app.set("port", process.env.PORT || 9000);
app.listen(app.get("port"), () => winston.info(`server running ____`));

// momo primary key
// d3547d7962ad4aacbcec688b348349ba
