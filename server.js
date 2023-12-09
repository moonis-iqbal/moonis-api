const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });
const cors = require("cors");
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const userService = require("./user-service.js");

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());
app.use(passport.initialize());

passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
}, (jwt_payload, done) => {
    userService.getUserById(jwt_payload._id)
        .then(user => done(null, user))
        .catch(err => done(err, false));
}));

app.post("/api/user/register", (req, res) => {
    userService.registerUser(req.body)
        .then(msg => res.json({ "message": msg }))
        .catch(msg => res.status(422).json({ "message": msg }));
});

app.post("/api/user/login", (req, res) => {
    userService.checkUser(req.body)
        .then(user => {
            const payload = { _id: user._id, userName: user.userName };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.json({ "message": "login successful", "token": token });
        })
        .catch(msg => res.status(422).json({ "message": msg }));
});

app.get("/api/user/favourites", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.getFavourites(req.user._id)
        .then(data => res.json(data))
        .catch(msg => res.status(422).json({ error: msg }));
});

app.put("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.addFavourite(req.user._id, req.params.id)
        .then(data => res.json(data))
        .catch(msg => res.status(422).json({ error: msg }));
});

app.delete("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.removeFavourite(req.user._id, req.params.id)
        .then(data => res.json(data))
        .catch(msg => res.status(422).json({ error: msg }));
});

app.get("/api/user/history", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.getHistory(req.user._id)
        .then(data => res.json(data))
        .catch(msg => res.status(422).json({ error: msg }));
});

app.put("/api/user/history/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.addHistory(req.user._id, req.params.id)
        .then(data => res.json(data))
        .catch(msg => res.status(422).json({ error: msg }));
});

app.delete("/api/user/history/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.removeHistory(req.user._id, req.params.id)
        .then(data => res.json(data))
        .catch(msg => res.status(422).json({ error: msg }));
});

userService.connect().then(() => {
    app.listen(HTTP_PORT, () => console.log("API listening on: " + HTTP_PORT));
}).catch(err => {
    console.log("Unable to start the server: " + err);
    process.exit();
});
