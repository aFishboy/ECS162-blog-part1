const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const dotenv = require("dotenv");
dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const PORT = 3000;

passport.use(
    new GoogleStrategy(
        {
            clientID: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            callbackURL: `http://localhost:${PORT}/auth/google/callback`,
        },
        (token, tokenSecret, profile, done) => {
            return done(null, profile);
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
        done(null, user);
});
