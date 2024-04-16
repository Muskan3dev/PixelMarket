const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");

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
    const sessionData = JSON.parse(req.session.user);
    const userId = sessionData._id;
    const email = sessionData.email;
    const cartItems = sessionData.cart.items;
    console.log({ cartitems: cartItems });
    const user = await User.findById(userId).populate({
      path: "cartItems.productId",
      strictPopulate: false,
    });

    const products = user.cart.items.map((i) => {
      return { quantity: i.quantity, productData: { ...i.productId._doc } };
    });
    console.log({ productCart: products });
    const order = new Order({
      user: {
        email: email,
        userId: userId,
      },
      products: products,
    });

    const result = await order.save();
    console.log({ CartItems: result });
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
