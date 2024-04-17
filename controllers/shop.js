const fs = require("fs");
const path = require("path");

const PDFDocument = require("pdfkit");

const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");
const order = require("../models/order");

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      console.log(products);
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;

  // Retrieve the product details
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        throw new Error("Product not found");
      }
      const sessData = JSON.parse(req.session.user);
      const userId = sessData._id;
      // Call the addToCart method on the user
      return User.findById(userId).then((user) => {
        if (!user) {
          throw new Error("User not found");
        }
        user.addToCart(product);
        req.session.user = JSON.stringify(user); //Update the session data
      });
    })
    .then((result) => {
      console.log("Product added to cart:", result);
      console.log({ updatedSession: req.session.user });
      res.redirect("/cart"); // Redirect to the cart page
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      console.log("Product removed from cart:", result);
      console.log({ UpdatedCart: req.user.cart });
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const email = req.user.email;

    const user = await User.findById(userId).populate("cart.items.productId");

    const products = user.cart.items.map((i) => {
      return {
        quantity: i.quantity,
        price: i.productId.price,
        productData: { ...i.productId._doc },
      };
    });
    const order = new Order({
      user: {
        email: email,
        userId: userId,
      },
      products: products,
    });

    const result = await order.save();
    await user.clearCart();
    res.redirect("/orders");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getOrders = (req, res, next) => {
  const sessionData = JSON.parse(req.session.user);
  const userId = sessionData._id;
  Order.find({ "user.userId": userId })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No Order found"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader("content-Type", "application/pdf");
      res.setHeader(
        "content-Disposition",
        'inline;filename="' + invoiceName + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice", {
        underline: true,
      });
      pdfDoc.text("--------------------");
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.productData.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.productData.title +
              "-" +
              prod.quantity +
              "x" +
              "$" +
              prod.productData.price
          );
      });
      pdfDoc.text("---");
      pdfDoc.fontSize(20).text("Total price:$" + totalPrice);
      pdfDoc.end();
    })
    .catch((err) => {
      next(err);
    });
};
