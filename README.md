<h1 align="center">Eprod Test Backend</h1>

Set the environment variables:
(You can see all enviroment key at **src/config/config**)

```bash
cp .env.example .env
```

## Feature

-   **NoSQL database**: [MongoDB](https://www.mongodb.com/) object data modeling using [Mongoose](https://mongoosejs.com/)
-   **Logging**: using [winston](https://github.com/winstonjs/winston) and [morgan](https://github.com/expressjs/morgan)
-   **Environment variables**: using [dotenv](https://github.com/motdotla/dotenv)
-   **Security**: set security HTTP headers using [helmet](https://helmetjs.github.io/)
-   **Compression**: gzip compression with [compression](https://github.com/expressjs/compression)

## Commands

Running locally with docker:

```bash
docker pull liamoz/eprod:0.0.1.RELEASE
```

Running locally:

```bash
yarn dev
```

building:

```bash
yarn build
```

Running production (build before use):

```bash
yarn start
```

## Enviroment Variable

The environment variables can be found and modified in the `.env` file. They come with these default values:

```bash
# Port number
APP_PORT=9000

# Prefix app path
APP_PREFIX_PATH=/


# Database config

# If you want to use database URI with DB_URI
DB_URI=mongodb://localhost:27017/Mocks

# Cloudinary
CLOUDINARY_CLOUD_NAME=somecloud
CLOUDINARY_API_KEY=coudapikey
CLOUDINARY_API_SECRET=cloudapisecret
```

## Project Structure

This project don't have **controllers** and **services** folders because we want to minimalized. If you want them, you can create it

```bash
src\
 |--config\         # Environment variables and configuration related things
 |--middlewares\    # Custom express middlewares
 |--models\         # Mongoose models (data layer)
 |--routes\         # Routes
 |--utils\          # Utility classes and functions
 |--app.js          # Express app
 |--index.js        # App entry point
```