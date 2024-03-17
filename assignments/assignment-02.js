const express = require("express");

const app = express();

app.use("/users", (req, res, next) => {
  console.log("At users route");
  res.send("<h1>Welcome to our Homepage</h1>");
});

app.use("/", (req, res, next) => {
  console.log("At slash route");
  res.send("<h1>Hello Users</h1>");
});

app.listen(2000);
