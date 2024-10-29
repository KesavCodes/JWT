const express = require("express");
const jwt = require("jsonwebtoken");

let users = [
  { id: 1, username: "john", password: "John0908", isAdmin: true },
  { id: 2, username: "jane", password: "Jane0908", isAdmin: false },
];

const app = express();
app.use(express.json());

let refreshTokens = [];

const generateToken = (user, type) => {
  return jwt.sign({ username: user.username, isAdmin: user.isAdmin }, "superSecret", {
    expiresIn: type === "access" ? "5s" : "365d",
  });
};

const verify = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res
      .status(401)
      .json({ data: null, message: "You are not authenticated!" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, "superSecret", (err, payload) => {
    if (err)
      return res.status(400).json({ data: null, message: "Invalid Token!" });
    req.user = payload;
    next();
  });
};

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (user) => user.username === username && user.password === password
  );
  if (!user)
    return res
      .status(400)
      .json({ message: "Invalid username or password", data: null });

  // Generate JWT token
  const accessToken = generateToken(user, "access");
  const refreshToken = generateToken(user, "refresh");
  refreshTokens.push(refreshToken);

  return res.json({
    message: "User retrieved successfully",
    data: {
      username: user.username,
      isAdmin: user.isAdmin,
      accessToken,
      refreshToken,
    },
  });
});

app.post("/api/logout", verify, (req, res) => {
  // Remove the refresh token from the list of refresh tokens
  const refreshToken = req.body.refreshToken;
  if (!refreshToken)
    return res.status(401).json({
      data: null,
      message: "Refresh token not available. Login again.",
    });
  refreshTokens = refreshTokens.filter(
    (token) => token !== refreshToken
  );
  return res.json({
    message: "User logged out successfully",
    data: null,
  });
});

app.post("/api/refresh", (req, res) => {
  // Take refresh token from the user
  const refreshToken = req.body.refreshToken;
  // return error if refresh token is not available or invalid
  if (!refreshToken)
    return res.status(401).json({
      data: null,
      message: "Refresh token not available. Login again.",
    });
  if (!refreshTokens.includes(refreshToken))
    return res.status(403).json({
      data: null,
      message: "Invalid request token. Please login again",
    });
  jwt.verify(refreshToken, "superSecret", (err, user) => {
    if (err)
      return res.status(403).json({
        data: null,
        message: "Invalid request token. Please login again",
      });

    // If no error, remove the old refresh token
    refreshTokens = refreshTokens.filter((item) => item !== refreshToken);

    // generate new access token and send it to the frontend
    const newAccessToken = generateToken(user, "access");
    const newRefreshToken = generateToken(user, "refresh");

    refreshTokens.push(newRefreshToken);

    return res.json({
      message: "User retrieved successfully",
      data: {
        username: user.username,
        isAdmin: user.isAdmin,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  });
});

app.get("/api/users/", (req, res) => {
  return res.json({ data: users, message: "All users retrieved successfully" });
});

app.delete("/api/users/:userId", verify, (req, res) => {
  if (req.user && (req.user.username == req.params.userId || req.user.isAdmin)) {
    // users = users.filter((item) => item.id != req.params.userId);
    return res.json({ data: null, message: "User has been deleted" });
  }
  return res
    .status(403)
    .json({ data: null, message: "Insufficient privileges." });
});

app.listen(5000, () => console.log("Listening on port 5000"));
