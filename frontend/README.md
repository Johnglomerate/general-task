Running with Expo:
The Expo build environment has some noticeable differences than react-scripts used with create-react-app. In order to start the expo application, run yarn start, then press 'w' to open the web app or 'i' to launch an iOS simulator. You can also run yarn web or yarn ios.

Writing platform specific code:
To write platform specific code, you can use the Platform library. There are examples on how to use Platform in this PR, but if the differences are substantial, then you can also use platform specific extensions. More information on that here: https://reactnative.dev/docs/platform-specific-code

Run the mock API server (make sure Go server is not running): `cd frontend/mockAPI/; json-server mock-api.json --watch --port 8080 --read-only --routes routes.json`

Test it out: `curl localhost:8080/tasks`

Edit the mock API contents in mock-api.json

---

# Deploy to Cloudflare:

Deploys are handled by Cloudflare Workers, which builds directly from the repository root using the top-level `wrangler.toml` (a Workers Assets SPA build). Pushing to the deploy branch triggers Cloudflare to run the build command and publish the contents of `frontend/dist` — there is no manual `wrangler publish` step.

To reproduce the build locally: `cd frontend/ && yarn install && yarn build`, then check the output in `frontend/dist`. Check out the live site at https://generaltask.com
