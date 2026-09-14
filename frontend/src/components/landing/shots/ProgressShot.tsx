import { CSSProperties } from 'react'
import Shot from './Shot'

const STRIP = [1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0]
const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4', 'now', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12']

const ProgressShot = () => (
    <Shot variant="card" innerClassName="ui ui--progress">
        <div className="ui-det">
            <div className="ui-details__head">
                <span className="mono ui-label">GOAL</span>
                <b className="pill pill--bad">Off track</b>
            </div>
            <h4>Close 15 tipping-v2 issues</h4>
            <div className="ui-progress">
                <strong>4 of 15</strong>
                <span className="muted">27% complete</span>
            </div>
            <div className="bar">
                <i style={{ ['--p']: '27%' } as CSSProperties} />
            </div>
            <div className="strip strip--lg">
                {STRIP.map((on, i) => (
                    <i key={i} data-on={on ? '1' : undefined} />
                ))}
            </div>
            <div className="weeks mono">
                {WEEK_LABELS.map((label) => (
                    <span key={label} className={label === 'now' ? 'now' : undefined}>
                        {label}
                    </span>
                ))}
            </div>
            <small className="mono muted">Counts as off track after 2 quiet weeks.</small>
        </div>
        <div className="ui-repair">
            <h5>2 weeks left — this is still in reach.</h5>
            <p>In May you said: “I want work I chose, not work that found me.” — still true?</p>
            <div className="ui-opt is-selected">
                <b>Ease the plan</b>
                <span>Fewer sessions this phase → On track</span>
            </div>
            <div className="ui-opt">
                <b>Extend the runway</b>
                <span>Push the date to Sep 30 → On track</span>
            </div>
            <div className="ui-opt">
                <b>Fresh week</b>
                <span>Reset the count, keep the plan → On track</span>
            </div>
            <div className="ui-opt">
                <b>Pause</b>
                <span>Stop the clock, no penalty → Paused</span>
            </div>
        </div>
    </Shot>
)

export default ProgressShot
