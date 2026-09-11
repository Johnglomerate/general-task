- [task-manager](#task-manager)
  - [Frontend testing](#frontend-testing)
  - [Pre-Commit](#pre-commit)
  - [Backend setup](#backend-setup)
  - [Backend testing](#backend-testing)
    - [Running Tests in IDE](#running-tests-in-ide)
  - [Deploying backend to Heroku](#deploying-backend-to-heroku)
    - [One-time Heroku setup](#one-time-heroku-setup)
    - [Deploying](#deploying)
    - [Environment variables](#environment-variables)
    - [Custom domain](#custom-domain)
  - [Documentation updates](#documentation-updates)
  - [Debugging backend](#debugging-backend)
  - [Useful links](#useful-links)

# task-manager

A manager of tasks.

## Frontend testing

First, install node.
Then, install yarn: `npm install -g yarn` (can use brew too)

```
cd frontend
yarn install
yarn start
```

When running `yarn install`, you may see the following error:
```
error An unexpected error occurred: "https://npm.fontawesome.com/@fortawesome/pro-light-svg-icons/-/6.1.2/pro-light-svg-icons-6.1.2.tgz: Request failed \"401 Unauthorized\"".
```

This means you need the font awesome API keys. Please reach out to your mentor to get access to those keys. You will need to these commands:

```
npm config set "@fortawesome:registry" https://npm.fontawesome.com/
npm config set "//npm.fontawesome.com/:_authToken" [AUTH TOKEN HERE]
```

## Pre-Commit

Install pre-commit by

```
brew install pre-commit
```

Then inside of the `task-manager` directory add pre-commit to the project using:

```
pre-commit install
```

## Backend setup

First, install Go and Docker. Ensure that your version of Go appropriately matches your computer operating system and architecture.

Next, if you need to test anything that requires credentials, such as Google OAuth flow, then you'll need to set appropriate environment variables with those values, for example:

```
export GOOGLE_OAUTH_CLIENT_SECRET=<secret here>
```

Then, you can run the following commands:

```
cd backend
docker-compose up -d
go run .

# Hit the API server
curl localhost:8080/ping
```

If you encounter a failure with your go run, ensure you do not have an existing local Mongo instance running on your machine and listening on the same port:

```
netstat -na |grep '27017.*LISTEN'
```

### Live-reloading / auto-recompile [highly recommended for devx]

We can setup the server to rebuild/rerun upon local file changes using [air](https://github.com/cosmtrek/air) so you don't have to constantly kill the server and rerun it yourself.

### Controlling log level

We can control the log level by setting the environment variable `LOG_LEVEL` (e.g. `info`, `debug`, etc) (which will override the setting in `.env`).

## Backend testing

```
cd backend
docker-compose up -d
./runtests.sh
```

To clear the test cache:

```
go clean -testcache
```

### Running Tests in IDE
To run tests through VS Code, put the following snippet in your `settings.json`:
```
    "go.testEnvVars": {
        "DB_NAME": "test"
    },
```

To run tests through GoLand, go to `Run | Edit Configurations` and then add a new `Go Test` configuration with `DB_NAME=test`.

## Deploying backend to Heroku

The backend is deployed to Heroku using Docker via the `heroku.yml` at the repo root. The app uses the `backend/Dockerfile` to build a container image.

The database is hosted on [MongoDB Atlas](https://www.mongodb.com/atlas). Connection details are configured via environment variables on Heroku.

### One-time Heroku setup

1. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Log in: `heroku login`
3. Create the app (if not already created):
   ```
   heroku create general-task-backend --stack container
   ```
4. Set up all required environment variables (see [Environment variables](#environment-variables) below)
5. Set up a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster and get the connection string

### Deploying

Push to Heroku from the repo root:

```
git push heroku master
```

Heroku will read `heroku.yml`, build the Docker image from `backend/Dockerfile`, and deploy it.

To verify the deploy:
```
curl https://<your-app>.herokuapp.com/ping/
```

### Environment variables

All required environment variables are defined in [`backend/.env`](backend/.env) with local development defaults. For production on Heroku, set each variable via `heroku config:set KEY=VALUE` or the Heroku dashboard with appropriate production values.

Heroku automatically sets the `PORT` environment variable. Gin reads this and binds to the correct port.

### Custom domain

To use a custom domain (e.g. `api.generaltask.com`):

```
heroku domains:add api.generaltask.com
```

Then update your DNS CNAME record to point to the Heroku DNS target shown by `heroku domains`.


## Documentation updates

We are in the process of migrating our documentation over to Swagger. In order to use Swagger, simply run the go server (via air or otherwise), and access [localhost:8080/swagger](localhost:8080/swagger). This will redirect you to the correct page.

If you are updating the documentation in any way, you should run:
`swag init`

This will update the documentation, and generate the required files to get the UI to update as well.

## Debugging backend

In development, we run Mongo Express at http://localhost:8081/ . Mongo Express is a web GUI which makes the local MongoDB instance available to explore and can be useful for debugging. Backend logs are available in the terminal window running the local go server.

In production, it is possible to use `heroku logs` to view the production application logs.

## Useful links

Google Go client examples: https://github.com/googleapis/google-api-go-client/tree/master/examples
