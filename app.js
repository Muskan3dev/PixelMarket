const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const errorController = require("./controllers/error");
const User = require("./models/user");

const MONGODB_URI =
  "mongodb+srv://Muskan03:CWJi1t4eDjANZZE3@cluster2.uv8bpmx.mongodb.net/shop";

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use((req, res, next) => {
  User.findById("6608226ee36f07a34efcdae1")
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(
    "mongodb+srv://Muskan03:CWJi1t4eDjANZZE3@cluster2.uv8bpmx.mongodb.net/shop?retryWrites=true&w=majority&appName=Cluster2"
  )
  .then((result) => {
    User.findOne().then((existingUser) => {
      if (!existingUser) {
        const user = new User({
          name: "Sam",
          email: "sam@test.com",
          cart: {
            items: [],
          },
        });
        user.save();
      }
    });
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });
