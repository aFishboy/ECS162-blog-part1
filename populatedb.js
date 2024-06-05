const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");

const dbFileName = "finster.db";

async function initializeDB() {
    const db = await sqlite.open({
        filename: dbFileName,
        driver: sqlite3.Database,
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            hashedGoogleId TEXT NOT NULL UNIQUE,
            avatarName TEXT,
            memberSince DATETIME NOT NULL
        );

        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            imageName TEXT,
            username TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            likes INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_likes (
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            PRIMARY KEY (user_id, post_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (post_id) REFERENCES posts(id)
        );
        
    `);

    const users = [
        {
            username: "FishermanFred",
            hashedGoogleId: "hashedGoogleId1",
            avatarName: null,
            memberSince: "2024-01-01 08:00:00",
        },
        {
            username: "ReelAngler",
            hashedGoogleId: "hashedGoogleId2",
            avatarName: null,
            memberSince: "2024-01-02 09:00:00",
        },
        {
            username: "ANewbieNemo",
            hashedGoogleId: "hashedGoogleId3",
            avatarName: null,
            memberSince: "2024-01-04 08:30:00",
        },
        {
            username: "ProBaiter",
            hashedGoogleId: "hashedGoogleId4",
            avatarName: null,
            memberSince: "2024-01-05 10:45:00",
        },
        {
            username: "MasterAngler",
            hashedGoogleId: "hashedGoogleId5",
            avatarName: null,
            memberSince: "2024-01-06 13:15:00",
        },
    ];

    const images = [
        null,
        "big-bass-fish-vector-cartoon-for-t-shirt-big-bass-fish-t-shirt-design-free.png",
        null,
        null,
        "smallfish.jpg",
        "fish_falling_into_water.gif",
    ];
    const posts = [
        {
            title: "Hooked on Fishing",
            content: "Just reeled in the big one!",
            imageName: images[0],
            username: "FishermanFred",
            timestamp: "2024-01-01 10:00:00",
            likes: 0,
        },
        {
            title: "Reel Deal",
            content: "This catch is off the scales!",
            imageName: images[1],
            username: "ReelAngler",
            timestamp: "2024-01-02 12:00:00",
            likes: 7,
        },
        {
            title: "The One That Got Away",
            content: "Lost a big one today, but here's a new post.",
            imageName: images[2],
            username: "FishermanFred",
            timestamp: "2024-01-03 15:30:00",
            likes: 2,
        },
        {
            title: "Catch of the Day",
            content: "Just netted something exciting! Don't miss it!",
            imageName: images[3],
            username: "ANewbieNemo",
            timestamp: "2024-01-04 09:45:00",
            likes: 1,
        },
        {
            title: "Tackle Time",
            content: "Getting ready to cast my line into the depths!",
            imageName: images[4],
            username: "ProBaiter",
            timestamp: "2024-01-05 11:15:00",
            likes: 0,
        },
        {
            title: "Fishing Frenzy",
            content: "Caught so many fish today, my arms are aching!",
            imageName: images[5],
            username: "MasterAngler",
            timestamp: "2024-01-06 14:20:00",
            likes: 5,
        },
    ];

    // Insert sample data into the database
    await Promise.all(
        users.map((user) => {
            return db.run(
                "INSERT INTO users (username, hashedGoogleId, avatarName, memberSince) VALUES (?, ?, ?, ?)",
                [
                    user.username,
                    user.hashedGoogleId,
                    user.avatarName,
                    user.memberSince,
                ]
            );
        })
    );

    await Promise.all(
        posts.map((post) => {
            return db.run(
                "INSERT INTO posts (title, content, imageName, username, timestamp, likes) VALUES (?, ?, ?, ?, ?, ?)",
                [
                    post.title,
                    post.content,
                    post.imageName,
                    post.username,
                    post.timestamp,
                    post.likes,
                ]
            );
        })
    );

    console.log("Database populated with initial data.");
    await db.close();
}

initializeDB().catch((err) => {
    console.error("Error initializing database:", err);
});
