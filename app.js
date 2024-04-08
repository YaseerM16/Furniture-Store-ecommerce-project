const express = require("express");
const app = express();
const port = 3000;
const dotenv = require("dotenv").config();
const session = require("express-session");
const nocache = require("nocache");
const dbConnect = require("./config/config");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
dbConnect();

app.use(nocache());
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(
  session({ resave: true, saveUninitialized: true, secret: "my secret" })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(userRoutes);
app.use(adminRoutes);

app.listen(port, () => console.log(`app listening on port ${port}!`));
