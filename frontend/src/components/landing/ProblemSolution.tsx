import { CSSProperties } from 'react'

const ProblemSolution = () => (
    <section className="ps" id="goals">
        <div className="gt-container ps__grid">
            <div data-reveal>
                <h2>Your to-do list is full. Your goals are still waiting.</h2>
                <ul className="ps__list">
                    <li>
                        <i>✕</i>Tasks live in five apps, a calendar — and your head.
                    </li>
                    <li>
                        <i>✕</i>Busy weeks that never move the things you actually care about.
                    </li>
                    <li>
                        <i>✕</i>Goal apps that hand you a plan, then nag when life happens.
                    </li>
                </ul>
            </div>
            <div data-reveal style={{ ['--delay']: '.12s' } as CSSProperties}>
                <h2>General Task connects today’s tasks to what you’re really after.</h2>
                <ul className="ps__list ps__list--check">
                    <li>
                        <i>✓</i>Set a goal with an honest weekly capacity — the plan is built to fit it.
                    </li>
                    <li>
                        <i>✓</i>The tasks you already do count toward it, week by week.
                    </li>
                    <li>
                        <i>✓</i>Drift is caught early, and you decide how to get back on track.
                    </li>
                </ul>
            </div>
        </div>
    </section>
)

export default ProblemSolution
