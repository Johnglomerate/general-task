import { FOLDER_ID, FOLDER_NAME, TASK_ID, TASK_TITLE } from '../support/stubData'

/*
 * Acceptance proof for "Make the web app work on a phone browser".
 *
 * This is the gate, not a survey: it walks the paths that are the difference between a phone-usable
 * app and a desktop app squeezed into 390px, and it runs on stubs so it needs no backend, no
 * database and no account. Each `it` below corresponds to one thing that has to keep working.
 */
describe('mobile shell at 390x844', () => {
    beforeEach(() => {
        cy.stubGeneralTaskApi()
        cy.emulatePhoneInput()
    })

    it('boots at /overview as a phone, not a narrow desktop', () => {
        cy.visit('/overview')

        // The premise of everything below. If Chrome ever stops honouring the emulated media
        // features, this fails loudly here rather than quietly turning the rest into desktop tests.
        cy.window().then((win) => {
            expect(win.matchMedia('(hover: none)').matches, 'reports a non-hovering pointer').to.eq(true)
            expect(win.matchMedia('(pointer: coarse)').matches, 'reports a coarse pointer').to.eq(true)
            expect(win.innerWidth, 'renders below the phone breakpoint').to.be.lessThan(768)
        })

        cy.get('[data-mobile-app-bar]').should('be.visible').and('contain.text', 'Daily Overview')

        // The seeded list arrived and resolved its items. Overview lists start collapsed, so opening
        // one is also the check that a phone tap reaches the tasks inside.
        cy.contains(FOLDER_NAME).should('be.visible')
        cy.contains('1 remaining').should('be.visible')
        cy.contains(FOLDER_NAME).click()
        cy.contains(TASK_TITLE).should('be.visible')
    })

    it('opens the navigation drawer from the app bar and closes it on navigation', () => {
        cy.visit('/overview')
        cy.get('[data-mobile-app-bar]').should('be.visible')

        cy.findByRole('dialog', { name: 'Navigation' }).should('not.exist')
        cy.get('[data-mobile-app-bar] [aria-label="Menu"]').click()

        cy.findByRole('dialog', { name: 'Navigation' })
            .should('be.visible')
            // The drawer is the only way to reach another list on a phone, so it has to carry the
            // real navigation rather than a reduced menu.
            .within(() => {
                cy.contains('Notes').should('be.visible')
                cy.contains(FOLDER_NAME).click()
            })

        cy.location('pathname').should('eq', `/tasks/${FOLDER_ID}`)
        cy.findByRole('dialog', { name: 'Navigation' }).should('not.exist')
        cy.get('[data-mobile-app-bar]').should('contain.text', 'Tasks')
    })

    it('shows the list on a list route instead of an empty detail pane', () => {
        cy.visit(`/tasks/${FOLDER_ID}`)

        cy.get('[data-mobile-pane="list"]').should('be.visible').and('contain.text', TASK_TITLE)
        // On desktop this route renders an empty-state detail pane beside the list. On a phone that
        // would be half a screen of nothing, so the pane must not be there at all.
        cy.get('[data-mobile-pane="detail"]').should('not.exist')
        // A list route is not a detail route: the app bar offers the drawer, not a back arrow.
        cy.get('[data-mobile-app-bar] [aria-label="Menu"]').should('be.visible')
        cy.get('[data-mobile-app-bar] [aria-label="Back"]').should('not.exist')
    })

    it('swaps to the detail pane when a task is selected, and back again', () => {
        cy.visit(`/tasks/${FOLDER_ID}`)
        cy.get('[data-mobile-pane="list"]').contains(TASK_TITLE).click()

        cy.location('pathname').should('eq', `/tasks/${FOLDER_ID}/${TASK_ID}`)
        // The title is an editable textarea, so it carries a value rather than text content.
        cy.get('[data-mobile-pane="detail"]').should('be.visible').find('textarea').should('have.value', TASK_TITLE)
        cy.get('[data-mobile-pane="list"]').should('not.be.visible')

        cy.get('[data-mobile-app-bar] [aria-label="Back"]').click()

        cy.location('pathname').should('eq', `/tasks/${FOLDER_ID}`)
        cy.get('[data-mobile-pane="list"]').should('be.visible')
        cy.get('[data-mobile-pane="detail"]').should('not.exist')
    })

    it('reaches "Schedule on calendar" by tapping, not by dragging or hovering', () => {
        // Dragging a task onto the calendar is the other way to schedule, and HTML5 drag events
        // never fire on touch. This menu is the only path in on a phone, so it is the one action
        // path worth pinning: a visible button, no hover and no right-click.
        cy.visit(`/tasks/${FOLDER_ID}/${TASK_ID}`)

        cy.get('[data-mobile-pane="detail"]').find('[aria-label="Task Actions"]').should('be.visible').click()
        cy.findByRole('menuitem', { name: /Schedule on calendar/ }).click()

        cy.findByRole('dialog').should('be.visible').as('scheduleModal')
        cy.get('@scheduleModal').contains('Schedule on calendar').should('be.visible')
        cy.get('@scheduleModal').contains('button', 'Schedule').should('be.visible').and('be.enabled')

        // Being on screen is not the same as fitting on screen: a modal sized for a desktop column
        // renders "visible" while running off the side of a phone.
        cy.get('@scheduleModal').then(([modal]) => {
            const { left, right } = modal.getBoundingClientRect()
            expect(left, 'modal starts on screen').to.be.at.least(0)
            expect(right, 'modal ends on screen').to.be.at.most(Cypress.config('viewportWidth'))
        })
    })
})
