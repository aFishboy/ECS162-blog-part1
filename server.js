const express = require("express");
const expressHandlebars = require("express-handlebars");
const session = require("express-session");
const canvas = require("canvas");
const dotenv = require("dotenv");
const passport = require("passport");
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
require("./auth");

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//db setup
const dbFileName = 'finster.db';
let db;

async function connectToDatabase() {
    db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
}

connectToDatabase().catch(err => {
    console.error('Error connecting to database:', err);
});


dotenv.config();

const app = express();
const PORT = 3000;

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Handlebars Helpers

    Handlebars helpers are custom functions that can be used within the templates 
    to perform specific tasks. They enhance the functionality of templates and 
    help simplify data manipulation directly within the view files.

    In this project, two helpers are provided:
    
    1. toLowerCase:
       - Converts a given string to lowercase.
       - Usage example: {{toLowerCase 'SAMPLE STRING'}} -> 'sample string'

    2. ifCond:
       - Compares two values for equality and returns a block of content based on 
         the comparison result.
       - Usage example: 
            {{#ifCond value1 value2}}
                <!-- Content if value1 equals value2 -->
            {{else}}
                <!-- Content if value1 does not equal value2 -->
            {{/ifCond}}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

// Set up Handlebars view engine with custom helpers
//
app.engine(
    "handlebars",
    expressHandlebars.engine({
        helpers: {
            toLowerCase: function (str) {
                return str.toLowerCase();
            },
            ifCond: function (v1, v2, options) {
                if (v1 === v2) {
                    return options.fn(this);
                }
                return options.inverse(this);
            },
            likedByUser: function (postId, userLikedPosts, options) {
                if (userLikedPosts && userLikedPosts.has(postId)) {
                    return options.fn(this);
                }
                return options.inverse(this);
            },
        },
    })
);

app.set("view engine", "handlebars");
app.set("views", "./views");

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Middleware
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.use(
    session({
        secret: "oneringtorulethemall", // Secret key to sign the session ID cookie
        resave: false, // Don't save session if unmodified
        saveUninitialized: false, // Don't create session until something stored
        cookie: { secure: false }, // True if using https. Set to false for development without https
    })
);

app.use(passport.initialize());
app.use(passport.session());

// Replace any of these variables below with constants for your application. These variables
// should be used in your template files.
//
app.use((req, res, next) => {
    res.locals.appName = "Finster";
    res.locals.copyrightYear = 2024;
    res.locals.postNeoType = "Cast";
    res.locals.loggedIn = req.session.loggedIn || false;
    res.locals.userId = req.session.userId || "";
    next();
});

app.use(express.static("public")); // Serve static files
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json()); // Parse JSON bodies (as sent by API clients)

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Routes
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Home route: render home view with posts and user
// We pass the posts and user variables into the home
// template
//
/* old get
app.get("/", (req, res) => {
    const posts = getPosts();
    const user = getCurrentUser(req) || {};
    res.render("home", { posts, user });
});
*/

app.get("/", async (req, res) => {
    const sort = req.query.sort || 'recent';  // Default to 'recent' if no sort specified
    let posts;

    if (sort === 'likes') {
        posts = await db.all('SELECT * FROM posts ORDER BY likes DESC, timestamp DESC');
    } else {
        // Most recent
        posts = await db.all('SELECT * FROM posts ORDER BY timestamp DESC');
    }
    const user = req.session.userId ? await db.get('SELECT * FROM users WHERE id = ?', req.session.userId) : {};
    res.render("home", { posts, user, sort });  // Pass the sort parameter to the template
});


// Register GET route is used for error response from registration
// or to display success from registration
app.get("/register", (req, res) => {
    if (req.query.error) {
        res.render("loginRegister", { regError: req.query.error });
    } else {
        res.render("loginRegister", { successReg: req.query.successReg });
    }
});

app.get("/registerUsername", (req, res) => {
    res.render("registerUsername", {
        username: req.query.username,
        error: req.query.error,
    });
});

// Login route GET route is used for error response from login
//
app.get("/login", (req, res) => {
    res.render("loginRegister", { loginError: req.query.error });
});

// Error route: render error page
//
app.get("/error", (req, res) => {
    res.render("error");
});

// Google OAuth login route
app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);


app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    async (req, res) => {
        const googleId = req.user.id; // Accessing the Google ID from req.user
        req.session.googleId = googleId;
        const user = findUserByGoogleId(googleId); // fix later!!!!!!!!!!!!!!!!!!!!!!!!!
        console.log("user in callback", user);

        if (user) {
            // User exists, log them in
            req.session.userId = user.id;
            req.session.loggedIn = true;
            res.redirect("/");
        } else {
            // User does not exist, redirect to register username
            req.session.googleId = googleId; // Store Google ID in session to use in registration
            res.redirect("/registerUsername");
        }
    }
);


app.get("/post/:id", async (req, res) => {
    const post = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    if (post) {
        res.render("postDetail", { post });
    } else {
        res.redirect("/error");
    }
});


app.post("/posts", async (req, res) => {
    const { title, content } = req.body;
    const user = req.session.userId ? await db.get('SELECT * FROM users WHERE id = ?', req.session.userId) : null;
    if (user) {
        await db.run('INSERT INTO posts (title, content, username, timestamp, likes) VALUES (?, ?, ?, ?, ?)', [title, content, user.username, formatDate(new Date()), 0]);
        res.redirect("/");
    } else {
        res.redirect("/login");
    }
});


app.post("/like/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/login");
    }

    const postId = parseInt(req.params.id, 10);
    const userId = req.session.userId;

    try {
        //check if user has liked post
        const exists = await db.get("SELECT 1 FROM user_likes WHERE user_id = ? AND post_id = ?", userId, postId);
        if (exists) {
            // unlike
            await db.run("DELETE FROM user_likes WHERE user_id = ? AND post_id = ?", userId, postId);
            await db.run("UPDATE posts SET likes = likes - 1 WHERE id = ?", postId);
        } else {
            //like
            await db.run("INSERT INTO user_likes (user_id, post_id) VALUES (?, ?)", userId, postId);
            await db.run("UPDATE posts SET likes = likes + 1 WHERE id = ?", postId);
        }
        res.redirect("/");
    } catch (error) {
        console.error("Error processing like:", error);
        res.redirect("/error");
    }
});



app.get("/profile", isAuthenticated, async (req, res) => {
    const user = await db.get('SELECT * FROM users WHERE id = ?', req.session.userId);
    const userPosts = await db.all('SELECT * FROM posts WHERE username = ? ORDER BY timestamp DESC', user.username);
    user.posts = userPosts;
    res.render("profile", { user, posts: userPosts });
});

app.get("/avatar/:username", handleAvatar);

app.post("/registerUsername", registerUser);

app.get("/emoji", async (req, res) => {
    try {
        const response = await fetch(
            `https://emoji-api.com/emojis?access_key=${process.env.EMOJI_API_KEY}`
        );
        const emojis = await response.json();
        res.json(emojis);
    } catch (error) {
        console.error("Error fetching emojis:", error);
        res.status(500).json({ error: "Failed to fetch emojis" });
    }
});


app.post("/login", async (req, res) => {
    const { username } = req.body;
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);
    if (user) {
        req.session.userId = user.id;
        req.session.loggedIn = true;
        res.redirect("/");
    } else {
        res.redirect("/login?error=Invalid+username");
    }
});

app.get("/logout", (req, res) => {
    // TODO: Logout the user
    req.logout();
    req.session.destroy(() => {
        res.redirect("/");
    });
});


app.post("/delete/:id", isAuthenticated, async (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const user = await db.get('SELECT * FROM users WHERE id = ?', req.session.userId);
    const post = await db.get('SELECT * FROM posts WHERE id = ? AND username = ?', [postId, user.username]);
    if (post) {
        await db.run('DELETE FROM posts WHERE id = ?', postId);
    }
    res.redirect("/");
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Server Activation
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Support Functions and Variables
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Example data for posts and users

let posts = [
    {
        id: 1,
        title: "Hooked on Fishing",
        content: "Just reeled in the big one!",
        username: "FishermanFred",
        timestamp: "2024-01-01 10:00",
        likes: 0,
    },
    {
        id: 2,
        title: "Reel Deal",
        content: "This catch is off the scales!",
        username: "ReelAngler",
        timestamp: "2024-01-02 12:00",
        likes: 3,
    },
    {
        id: 3,
        title: "The One That Got Away",
        content: "Lost a big one today, but here's a new post.",
        username: "FishermanFred",
        timestamp: "2024-01-03 15:30",
        likes: 2,
    },
    {
        id: 4,
        title: "Catch of the Day",
        content: "Just netted something exciting! Don't miss it!",
        username: "ANewbieNemo",
        timestamp: "2024-01-04 09:45",
        likes: 1,
    },
    {
        id: 5,
        title: "Tackle Time",
        content: "Getting ready to cast my line into the depths!",
        username: "ProBaiter",
        timestamp: "2024-01-05 11:15",
        likes: 0,
    },
    {
        id: 6,
        title: "Fishing Frenzy",
        content: "Caught so many fish today, my arms are aching!",
        username: "MasterAngler",
        timestamp: "2024-01-06 14:20",
        likes: 5,
    },
];

let users = [
    {
        id: 1,
        username: "FishermanFred",
        avatar_url: undefined,
        memberSince: "2024-01-01 08:00",
        likedPosts: new Set(),
    },
    {
        id: 2,
        username: "ReelAngler",
        avatar_url: undefined,
        memberSince: "2024-01-02 09:00",
        likedPosts: new Set(),
    },
    {
        id: 3,
        username: "ANewbieNemo",
        avatar_url: undefined,
        memberSince: "2024-01-04 08:30",
        likedPosts: new Set(),
    },
    {
        id: 4,
        username: "ProBaiter",
        avatar_url: undefined,
        memberSince: "2024-01-05 10:45",
        likedPosts: new Set(),
    },
    {
        id: 5,
        username: "MasterAngler",
        avatar_url: undefined,
        memberSince: "2024-01-06 13:15",
        likedPosts: new Set(),
    },
];

// Function to find a user by username
function findUserByUsername(username) {
    // TODO: Return user object if found, otherwise return undefined
    return users.find((user) => user.username === username);
}

// Function to find a user by user ID
function findUserById(userId) {
    // TODO: Return user object if found, otherwise return undefined
    console.log("🚀 ~ findUserById ~ user.id  userID:", userId);
    return users.find((user) => user.id === userId);
}

async function findUserByGoogleId(googleId) {
    const user = await db.get(
        "SELECT 1 FROM users WHERE hashedGoogleId = ?",
        googleId
    );
    console.log("googleId", googleId);
    console.log("user in findbygId", user);
    return user
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect("/login");
    }
}

async function registerUser(req, res) {
    const { username } = req.body;
    const userNameExists = await db.get(
        "SELECT 1 FROM users WHERE username = ?",
        username
    );
    if (userNameExists) {
        res.redirect("/register?error=Username+already+exists");
    } else if (/\s/.test(username)) {
        res.redirect("/register?error=Username+cannot+contain+whitespace");
    } else {
        addUser(req);
        loginUser(req, res);
    }
}

async function addUser(req) {
    await db.run(
        "INSERT INTO users (username, hashedGoogleId, memberSince) VALUES (?, ?, ?)",
        [req.body.username, req.user.id, new Date()]
    );

    return newUser;
}

// Function to login a user
//Credit Dr. Posnett in class
function loginUser(req, res) {
    const username = req.body.username;
    const user = findUserByUsername(username);
    if (user) {
        req.session.userId = user.id;
        req.session.loggedIn = true;
        res.redirect("/");
    } else {
        //Invalid username
        res.redirect("/login?error=Invalid+username");
    }
}

// Function to logout a user
function logoutUser(req, res) {
    // TODO: Destroy session and redirect appropriately
    req.session.destroy(() => {
        res.redirect("/");
    });
}

// Function to render the profile page
function renderProfile(req, res) {
    // TODO: Fetch user posts and render the profile page
    const user = getCurrentUser(req);
    const userPosts = posts.filter((post) => post.username === user.username);
    res.render("profile", { user, posts: userPosts });
}

// Function to update post likes
function updatePostLikes(req, res) {
    // TODO: Increment post likes if conditions are met
    const postId = parseInt(req.params.id, 10);
    const post = posts.find((p) => p.id === postId);
    const user = getCurrentUser(req);
    if (post && user && post.username !== user.username) {
        post.likes += 1;
    }
    res.redirect("/");
}

function postLikedByUser(postId, user) {
    return user.likedPosts.has(postId);
}

// Function to handle avatar generation and serving
function handleAvatar(req, res) {
    const { username } = req.params;
    const firstLetter = username.charAt(0).toUpperCase();
    const avatarBuffer = generateAvatar(firstLetter);
    res.set("Content-Type", "image/png");
    res.send(avatarBuffer);
}

// Function to get the current user from session
function getCurrentUser(req) {
    // TODO: Return the user object if the session user ID matches
    console.log("🚀 ~ getCurrentUser ~ req.session:", req.session.userId);

    return findUserById(req.session.userId);
}

// Function to get all posts, sorted by latest first
function getPosts() {
    return posts.slice().reverse();
}

// Function to add a new post
function addPost(title, content, user) {
    // TODO: Create a new post object and add to posts array
    const newPost = {
        id: posts.length + 1,
        title,
        content,
        username: user.username,
        timestamp: formatDate(new Date()),
        likes: 0,
    };
    posts.push(newPost);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// Function to generate an image avatar
function generateAvatar(letter, width = 100, height = 100) {
    const colorHex = letterToColorHex(letter);

    const newCanvas = canvas.createCanvas(width, height);
    const ctx = newCanvas.getContext("2d");
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, width, height);

    if (isColorDark(colorHex)) {
        ctx.fillStyle = "#ffffff";
    } else {
        ctx.fillStyle = "#000000";
    }
    ctx.font = "50px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, width / 2, height / 2);

    // Convert the canvas to a PNG buffer
    return newCanvas.toBuffer();
}

function letterToColorHex(letter) {
    const asciiValue = letter.charCodeAt(0);
    const red = (asciiValue * 123) % 256;
    const green = (asciiValue * 321) % 256;
    const blue = (asciiValue * 543) % 256;
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function toHex(value) {
    const hex = value.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
}

function isColorDark(colorHex) {
    // Convert hex to RGB
    const r = parseInt(colorHex.substr(1, 2), 16);
    const g = parseInt(colorHex.substr(3, 2), 16);
    const b = parseInt(colorHex.substr(5, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Check if color is dark or light based on luminance threshold
    return luminance <= 0.5;
}
