# Finster

## Aidan Khatana, Samuel Howard

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

