import '@testing-library/cypress/add-commands'
import { AUTHORIZATION_COOKE } from '../../src/constants'
import { calendars, folders, overviewViews, settings, task, userInfo } from './stubData'

// The dev build's API base URL (src/environment.ts). `yarn build:test` bakes this in, so this is the
// only origin the app talks to and one glob covers the whole surface.
const API = 'http://localhost:8080'

/*
 * Stubs every network call the app makes so the spec needs no backend, no database and no account.
 *
 * Two behaviours here are load-bearing rather than convenience:
 *  - A catch-all is registered FIRST. Cypress matches the most recently defined intercept, so the
 *    specific handlers below still win; the catch-all only picks up calls nobody listed. It fails
 *    rather than passing through, because a real request would leak to whatever is listening on
 *    :8080 on the developer's machine.
 *  - Nothing may answer 401. utils/api.ts's response interceptor clears the auth cookie and
 *    `window.location.replace`s out of the SPA on any 401, which reads as a mystery blank page.
 */
const stubGeneralTaskApi = () => {
    // Serving a `yarn build` bundle instead of `yarn build:test` swaps the API base URL to
    // api.generaltask.com, where none of the stubs below match and the run would quietly talk to
    // production. Fail on the first such call instead, naming the fix.
    cy.intercept('https://*.generaltask.com/**', (req) => {
        throw new Error(
            `The app under test called production (${req.url}). It was built with \`yarn build\`; ` +
                'serve a `yarn build:test` bundle so its API base URL is http://localhost:8080.'
        )
    })

    // Registered FIRST, so every specific handler below wins and only calls nobody listed land here.
    // It fails rather than answering 404: most query hooks swallow a 404 into React Query error
    // state, so a new boot-time request could go unstubbed while the visible assertions still pass,
    // and the gate would quietly stop proving that the run is fully offline.
    cy.intercept({ url: `${API}/**` }, (req) => {
        throw new Error(`Unstubbed API call: ${req.method} ${req.url}. Add it to cy.stubGeneralTaskApi().`)
    })

    // Third parties the app reaches for on its own: the FontAwesome kit script in index.html and
    // react-ga4's analytics beacons. Stubbing them keeps the spec off the network entirely and keeps
    // CI runs out of the real analytics property. Icons render from the bundled packages regardless.
    cy.intercept('https://kit.fontawesome.com/**', { statusCode: 200, body: '' })
    cy.intercept('https://*.google-analytics.com/**', { statusCode: 204, body: '' })
    cy.intercept('https://*.googletagmanager.com/**', { statusCode: 200, body: '' })

    cy.intercept('GET', `${API}/user_info/`, userInfo).as('userInfo')
    cy.intercept('GET', `${API}/tasks/v4/`, [task]).as('tasks')
    cy.intercept('GET', `${API}/sections/v2/`, folders).as('folders')
    cy.intercept('GET', `${API}/overview/views*`, overviewViews).as('overviewViews')
    cy.intercept('GET', `${API}/settings/`, settings).as('settings')
    cy.intercept('GET', `${API}/calendars/`, calendars).as('calendars')

    // Everything the shell polls on boot but this spec does not exercise. `/settings/` and the list
    // endpoints must be arrays — settings.hooks.ts calls `.find` on the payload.
    cy.intercept('GET', `${API}/meeting_preparation_tasks/`, [])
    cy.intercept('GET', `${API}/tasks/fetch/`, {})
    cy.intercept('GET', `${API}/events/*`, [])
    cy.intercept('GET', `${API}/notes/`, [])
    cy.intercept('GET', `${API}/linked_accounts/`, [])
    // Pulled in by the drawer's service list, not just the settings modal.
    cy.intercept('GET', `${API}/linked_accounts/supported_types/`, [])
    cy.intercept('GET', `${API}/recurring_task_templates/v2/`, [])
    cy.intercept('GET', `${API}/recurring_task_templates/backfill_tasks/`, [])
    cy.intercept('POST', `${API}/log_events/`, {})

    cy.setCookie(AUTHORIZATION_COOKE, 'mobile-acceptance-token')
}

const cdp = (command: string, params: Record<string, unknown>) =>
    Cypress.automation('remote:debugger:protocol', { command, params })

/*
 * Makes the browser report itself as a touch device.
 *
 * The 390x844 viewport alone only satisfies `useIsMobile`, which is a width check. Real phone
 * behaviour in this app also keys off `(hover: hover)` via `useCanHover` and `pointerQuery` — the
 * touch affordances from #40/#41 — and headless Chrome answers that query `hover: hover` at any
 * width. Without this the spec would exercise a narrow desktop, not a phone.
 *
 * Device metrics are deliberately NOT overridden: that applies to the whole tab, and Cypress renders
 * the app in an iframe, so it would fight the viewport rather than set it. Emulated media and touch
 * emulation are target-level and reach the iframe, and survive `cy.visit`.
 */
const emulatePhoneInput = () =>
    cy.wrap(
        Promise.all([
            cdp('Emulation.setEmulatedMedia', {
                features: [
                    { name: 'hover', value: 'none' },
                    { name: 'any-hover', value: 'none' },
                    { name: 'pointer', value: 'coarse' },
                    { name: 'any-pointer', value: 'coarse' },
                ],
            }),
            cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }),
        ]),
        { log: false }
    )

Cypress.Commands.add('stubGeneralTaskApi', stubGeneralTaskApi)
Cypress.Commands.add('emulatePhoneInput', emulatePhoneInput)

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Cypress {
        interface Chainable {
            /**
             * Stub every API call the app makes, and set the auth cookie.
             * @example cy.stubGeneralTaskApi()
             */
            stubGeneralTaskApi(): void
            /**
             * Report the browser as a touch device: `hover: none`, `pointer: coarse`, touch events.
             * @example cy.emulatePhoneInput()
             */
            emulatePhoneInput(): void
        }
    }
}
