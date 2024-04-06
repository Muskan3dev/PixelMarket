const User = require("../models/user");

const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const { EMAIL, PASSWORD } = require("../env.js");

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    isAuthenticated: false,
    errorMessage: message,
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    isAuthenticated: false,
    errorMessage: message,
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash("error", "Invalid email or password");
        return res.redirect("/login");
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = JSON.stringify(user);
            console.log({ session: req.session });
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          }
          req.flash("error", "Invalid email or password");
          res.redirect("/login");
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  User.findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        req.flash(
          "error",
          "E-Mail exists already, please pick a different one."
        );
        return res.redirect("/signup");
      }

      // Hash the password
      return bcrypt.hash(password, 12);
    })
    .then((hashedPassword) => {
      // Create a new user
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then((result) => {
      // Send a confirmation email
      let config = {
        service: "gmail",
        auth: {
          user: EMAIL,
          pass: PASSWORD,
        },
      };
      let transporter = nodemailer.createTransport(config);
      let MailGenerator = new Mailgen({
        theme: "default",
        product: {
          name: "Mailgen",
          link: "https://mailgen.js",
        },
      });
      let response = {
        body: {
          name: "From shop@node-complete.com ",
          intro: "Signup Confirmation",
          outro: "You Successfully Signed up.",
        },
      };
      let mail = MailGenerator.generate(response);
      let message = {
        from: EMAIL,
        to: email,
        subject: "Signup Confirmation",
        html: mail,
      };

      // Send the email
      return transporter.sendMail(message);
    })
    .then(() => {
      // Redirect to login page after email is sent
      res.redirect("/login");
    })
    .catch((err) => {
      console.log("ERROR", err);
      res.status(500).json({ error: "Internal server error" });
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};
