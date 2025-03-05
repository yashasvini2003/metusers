const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const passportJWT = require("passport-jwt");
dotenv.config();
const userService = require("./user-service.js");

const HTTP_PORT = process.env.PORT || 8080;
// Add this CORS configuration before your routes to apply it globally
app.use(cors({
  origin: 'https://metmuseum-enrvmabo4-yashasvinis-projects.vercel.app',  // Specify your frontend URL here
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // You can specify which methods are allowed
  allowedHeaders: ['Content-Type', 'Authorization'],  // Specify allowed headers if needed
}));

// JSON Web Token Setup
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
// Configure its options
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");

jwtOptions.secretOrKey = process.env.JWT_SECRET;

var strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
  console.log("payload received", jwt_payload);

  if (jwt_payload) {
    // The following will ensure that all routes using
    // passport.authenticate have a req.user._id, req.user.userName, req.user.fullName & req.user.role values
    // that matches the request payload data
    next(null, { _id: jwt_payload._id, userName: jwt_payload.userName });
  } else {
    next(null, false);
  }
});

// tell passport to use our "strategy"
passport.use(strategy);

// add passport as application-level middleware
app.use(passport.initialize());

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "API is listing..." });
});

app.post("/api/user/register", (req, res) => {
  userService
    .registerUser(req.body)
    .then((msg) => {
      res.json({ message: msg });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

app.post("/api/user/login", (req, res) => {
  userService
    .checkUser(req.body)
    .then((user) => {
      // Generate the payload object using the user object
      const payload = {
        _id: user._id,
        userName: user.userName,
      };
      // Sign the payload using the JWT_SECRET from the .env file
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      // Return the token to the client
      res.status(200).json({
        message: {
          status: "success",
          token: token,
        },
      });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

app.get("/api/user/favourites",passport.authenticate('jwt', { session: false }), (req, res) => {
  userService
    .getFavourites(req.user._id)
    .then((data) => {
      res.json(data);
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

app.put("/api/user/favourites/:id",passport.authenticate('jwt', { session: false }), (req, res) => {
  userService
    .addFavourite(req.user._id, req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

app.delete("/api/user/favourites/:id",passport.authenticate('jwt', { session: false }), (req, res) => {
  userService
    .removeFavourite(req.user._id, req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

app.get("/api/user/history",passport.authenticate('jwt', { session: false }), (req, res) => {
  userService
    .getHistory(req.user._id)
    .then((data) => {
      res.json(data);
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

app.put("/api/user/history/:id", passport.authenticate('jwt', { session: false }),(req, res) => {
  userService
    .addHistory(req.user._id, req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

app.delete("/api/user/history/:id",passport.authenticate('jwt', { session: false }), (req, res) => {
  userService
    .removeHistory(req.user._id, req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch((msg) => {
      res.status(422).json({ error: msg });
    });
});

userService
  .connect()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("API listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
  });
