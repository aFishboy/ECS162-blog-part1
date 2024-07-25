# Finster

## Samuel Howard, Aidan Khatana

## Setting up the Repository

1. Run `npm install` to install the necessary dependencies.

2. Make sure to have the database initialized before starting the server. By default, the database is not included in the git code. Use `node populatedb.js` to initialize the database.

## Optional Installations

To use nodemon for automatically restarting the server during development, install it globally with:

```npm install -g nodemon```

## Mandatory for Emojis

In order to get emojis to work, a .env file must be created with the following format:

EMOJI_API_KEY=your_emoji_api_key

To get an API key, go to: https://emoji-api.com/

## Check Out the Demo!
<a href="https://youtu.be/CtbImUoT3Xo" target="_blank">
  <img src="https://img.youtube.com/vi/CtbImUoT3Xo/maxresdefault.jpg" alt="Watch the video" />
</a>

## Additional Features

- **Image/GIF Upload for Posts**: Users can now upload images or GIFs to include in posts. A new button has been added to the create post section, allowing users to upload images from their file system. Supported file types include png, jpg, and gif.
- **Profile Picture Upload**: Users can upload images or GIFs to use as a profile picture, replacing the default avatar. The custom profile picture will populate all instances of profile pictures and is persistent even if the server is taken down. Supported file types include png, jpg, and gif.
- **Account Deletion**: Users can delete their account, which includes deletion of all profile information, Google account info, posts made by the user, and likes the user made. This feature is important for users to have control over their own data, especially the deletion of it. Note that user following and followers were not implemented due to time constraints.

All part A and B features are functional, interactive, and responsive to different screen sizes.

## Application Features

- **Database Integration**: Fully integrated and all features working with the database.
- **OAuth Login Integration**: Fully functional.
- **Environment Variables**: .env file used for client key, secret, and API key.
- **Home Page**: Fully functional and responsive, including header leading to Login/Register page. Posts are displayed correctly, and liking posts or “casts” is restricted until logged in.
- **Login/Register Page**: Fully functional and responsive. Includes appropriate prompt to sign in with Google OAuth. Displays appropriate error messages for registration and login issues. Redirects to home page after successful registration.
- **Home Page When Logged In**: Fully functional and responsive. Includes "Create a new cast" section, emoji integration, upload image or gif feature, title requirement, and ability to like other posts only once. Users can delete their own posts. The like/delete button is interactive, and the profile avatar in the top right redirects to the profile page.
- **Profile Page**: Fully functional and responsive. Correctly displays user's own posts with delete functionality. Includes delete account button and upload image or gif profile picture feature.
