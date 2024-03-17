const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

app.use(adminRoutes);
app.use(shopRoutes);

app.listen(3000);
