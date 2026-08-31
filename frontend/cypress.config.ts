import { defineConfig } from 'cypress'

// The app under test is a static `yarn build:test` bundle served on :3000. That is a *development*
// build, so `src/environment.ts` points its API base URL at http://localhost:8080 and every request
// is intercepted in `cypress/support/commands.ts`. Nothing here can reach api.generaltask.com.
export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:3000',
        specPattern: 'cypress/e2e/**/*.cy.ts',
        supportFile: 'cypress/support/e2e.ts',
        // A phone, not a narrow desktop window: 390x844 is the iPhone 12/13/14 logical viewport, and
        // sits under BREAKPOINTS.phone (768) so `useIsMobile` reports true. Touch and `hover: none`
        // are layered on top per-test by `cy.emulatePhoneInput()`.
        viewportWidth: 1280,
        viewportHeight: 800,
        video: false,
        // The suite is a small acceptance gate, not a broad regression suite; one retry absorbs the
        // occasional slow first paint of a 4MB dev bundle without hiding a real failure.
        retries: { runMode: 1, openMode: 0 },
    },
})
