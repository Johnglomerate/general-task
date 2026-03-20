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
  - [Working with Slack](#working-with-slack)
    - [How to link to local Slack App](#how-to-link-to-local-slack-app)
    - [How to get new Slack tasks to local server](#how-to-get-new-slack-tasks-to-local-server)
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

## Working with Slack

The Slack integration has some nuances which prevent local linking from the same App. Thus, we have 2 different Slack apps we use, one for local development, and one for production. They should behave in exactly the same way, except that one points to our local instances, and one points towards our prod servers.

### How to link to local Slack App

First, make sure you have the correct environment variables set. You will need both the `SLACK_OAUTH_CLIENT_SECRET` and `SLACK_SIGNING_SECRET` secrets. You can find both of these in the Basic Information section in the [Slack developer console](https://api.slack.com).

Linking to the local Slack App requires a number of additional steps, as Slack does not allow for interactions with localhost addresses. Thus, we must take the following steps:

- Use ngrok to allow forwarding of our localhost to the internet: `ngrok http 8080`
- Input your current ngrok url to the [Slack app as an acceptable callback](https://api.slack.com/apps/A03NMQNKUF2/oauth?) 
- Change your SERVER_URL in the .env file (in the backend directory) to match this ngrok URL

Then, go to your localhost, and link as you would any other app. This should get you to a dialogue window, accept the terms, and you will be redirected to a URL beginning with ngrok-...

This request will fail. This is due to the fact that the cookies are localhost specific, and the browser does not know that ngrok-... and localhost are the same. Thus:

- Copy the URL from the popup, and paste it in a new tab (as most browsers do not allow for editing URLs in popups). Replace the beginning of the URL with localhost:8080. This should redirect you to the correct page, and you should see `Success`. This means that the linking was successful.

### How to get new Slack tasks to local server

Once the App has been linked to your account locally, it will continue to be linked unless the DB is nuked. In order to use this account to test, all that is required is to spin up an instance of `ngrok http 8080`, and then input the URL `https://ngrok...io/tasks/create_external/slack/` [here as the request URL](https://api.slack.com/apps/A03NMQNKUF2/interactive-messages?).

## Working with Linear

As with Slack, Linear has similar nuances with not allowing localhost addresses to interact with the app. Thus, the same steps are required.

### How to link to local Linear App

First, make sure you have the correct environment variables set. You will need both the `LINEAR_OAUTH_CLIENT_ID` and `LINEAR_OAUTH_CLIENT_SECRET` secrets. You can find both of these in the Basic Information section in the [Linear app settings page](https://linear.app/general-task/settings/api/applications/5f2152f7-7ba9-4a1a-9ca1-a89328340668).

Linking to the local Linear App requires a number of additional steps, as Linear does not allow for interactions with localhost addresses. Thus, we must take the following steps:

- Use ngrok to allow forwarding of our localhost to the internet: `ngrok http 8080`
- Input your current ngrok url to the [Linear app as an acceptable callback](https://linear.app/general-task/settings/api/applications/5f2152f7-7ba9-4a1a-9ca1-a89328340668) 
- Change your SERVER_URL in the .env file (in the backend directory) to match this ngrok URL

Then, go to your localhost, and link as you would any other app. This should get you to a dialogue window, accept the terms, and you will be redirected to a URL beginning with ngrok-...

This request will fail. This is due to the fact that the cookies are localhost specific, and the browser does not know that ngrok-... and localhost are the same. Thus:

- Copy the URL from the popup, and paste it in a new tab (as most browsers do not allow for editing URLs in popups). Replace the beginning of the URL with localhost:8080. This should redirect you to the correct page, and you should see `Success`. This means that the linking was successful.

### How to get new Linear tasks to local server

Once the App has been linked to your account locally, it will continue to be linked unless the DB is nuked. In order to use this account to test, all that is required is to spin up an instance of `ngrok http 8080`, and then input the URL `https://ngrok...io/linear/webhook/` [here as the webhook URL](https://linear.app/general-task/settings/api/applications/5f2152f7-7ba9-4a1a-9ca1-a89328340668).

## Useful links

Google Go client examples: https://github.com/googleapis/google-api-go-client/tree/master/examples
