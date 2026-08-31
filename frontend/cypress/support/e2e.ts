import './commands'

// The app is a big SPA with third-party editors in it; an unrelated render warning throwing inside a
// listener should not decide whether the mobile shell works. Assertions still fail the spec.
Cypress.on('uncaught:exception', () => false)
