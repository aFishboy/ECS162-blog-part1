const express = require("express");
const expressHandlebars = require("express-handlebars");
const session = require("express-session");
const canvas = require("canvas");

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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

// Replace any of these variables below with constants for your application. These variables
// should be used in your template files.
//
app.use((req, res, next) => {
    res.locals.appName = "MicroBlog";
    res.locals.copyrightYear = 2024;
    res.locals.postNeoType = "Post";
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
app.get("/", (req, res) => {
    const posts = getPosts();
    const user = getCurrentUser(req) || {};
    res.render("home", { posts, user });
});

// Register GET route is used for error response from registration
// or to display success from registration
app.get("/register", (req, res) => {
    console.log("success " + req.query.successReg);
    console.log("error " + req.query.error);
    if (req.query.error){
        res.render("loginRegister", { regError: req.query.error });
    } else {
        res.render("loginRegister", { successReg: req.query.successReg });
    }
});

// Login route GET route is used for error response from login
//
app.get("/login", (req, res) => {
    console.log("app.get /login");
    res.render("loginRegister", { loginError: req.query.error });
});

// Error route: render error page
//
app.get("/error", (req, res) => {
    res.render("error");
});

// Additional routes that you must implement

app.get("/post/:id", (req, res) => {
    // TODO: Render post detail page
    const post = posts.find((p) => p.id === parseInt(req.params.id, 10));
    if (post) {
        res.render("postDetail", { post });
    } else {
        res.redirect("/error");
    }
});
app.post("/posts", (req, res) => {
    // TODO: Add a new post and redirect to home
    const { title, content } = req.body;
    const user = getCurrentUser(req);
    if (user) {
        addPost(title, content, user);
        res.redirect("/");
    } else {
        res.redirect("/login");
    }
});
app.post("/like/:id", (req, res) => {
    // TODO: Update post likes
    const postId = parseInt(req.params.id, 10);
    const post = posts.find((p) => p.id === postId);
    const user = getCurrentUser(req);
    if (post && user) {
        if (!postLikedByUser(postId, user)) {
            post.likes += 1;
            user.likedPosts.add(postId);
        } else {
            post.likes -= 1;
            user.likedPosts.delete(postId);
        }
        res.redirect("/");
    }
});
app.get("/profile", isAuthenticated, (req, res) => {
    // TODO: Render profile page
    const user = getCurrentUser(req);
    const userPosts = posts.filter((post) => post.username === user.username);
    user.posts = userPosts;
    res.render("profile", { user, posts: userPosts });
});
app.get("/avatar/:username", handleAvatar);

//Credit Dr. Posnett in class
app.post("/register", registerUser);

app.post("/login", (req, res) => {
    // TODO: Login a user
    const { username } = req.body;
    const user = findUserByUsername(username);
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
    req.session.destroy(() => {
        res.redirect("/");
    });
});
app.post("/delete/:id", isAuthenticated, (req, res) => {
    console.log("POST /delete/:id");
    // TODO: Delete a post if the current user is the owner
    const postId = parseInt(req.params.id, 10);
    const user = getCurrentUser(req);
    const postIndex = posts.findIndex((p) => p.id === postId && p.username === user.username);
    if (postIndex >= 0) {
        posts.splice(postIndex, 1);
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
        title: "Sample Post",
        content: "This is a sample post.",
        username: "SampleUser",
        timestamp: "2024-01-01 10:00",
        likes: 0,
    },
    {
        id: 2,
        title: "Another Post",
        content: "This is another sample post. This is another sample post. This is another sample post. This is another sample post. This is another sample post.",
        username: "AnotherUser",
        timestamp: "2024-01-02 12:00",
        likes: 3,
    },
];
let users = [
    {
        id: 1,
        username: "SampleUser",
        avatar_url: undefined,
        memberSince: "2024-01-01 08:00",
        likedPosts: new Set(),
    },
    {
        id: 2,
        username: "AnotherUser",
        avatar_url: undefined,
        memberSince: "2024-01-02 09:00",
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
    return users.find((user) => user.id === userId);
}

// Function to add a new user
function addUser(username) {
    // TODO: Create a new user object and add to users array
    const newUser = {
        id: users.length + 1,
        username,
        avatar_url: undefined,
        memberSince: new Date().toISOString(),
    };
    users.push(newUser);
    return newUser;
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    console.log("userID " + req.session.userId);
    if (req.session.userId) {
        next();
    } else {
        res.redirect("/login");
    }
}

// Function to register a user
function registerUser(req, res) {
    const { username } = req.body;
    if (findUserByUsername(username)) {
        res.redirect("/register?error=Username+already+exists");
    } 
    else if (/\s/.test(username)) {
        res.redirect("/register?error=Username+cannot+contain+whitespace");
    } else {
        addUser(username);
        res.redirect("/register?successReg=Account+registered+successfully.+Please+login.");
    }
}

// Function to login a user
//Credit Dr. Posnett in class
function loginUser(req, res) {
    const username = req.body.username;
    const user = findUserByUsername(username);

    if (user) {
        //Successful login
        req.session.userID = user.id;
        req.session.loggedIn = true;
        res.redirect('/');
    } else {
        //Invalid username
        res.redirect('/login?error=Invalid+username');
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
        timestamp: new Date().toISOString(),
        likes: 0,
    };
    posts.push(newPost);
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
    ctx.font = "50px Arial"
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
