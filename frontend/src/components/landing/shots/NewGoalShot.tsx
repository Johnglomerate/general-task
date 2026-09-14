import { Colors } from '../../../styles'
import Shot from './Shot'

const NewGoalShot = () => (
    <Shot variant="card" innerClassName="ui ui--center" style={{ background: Colors.background.sub }}>
        <div className="ui-modal">
            <div className="ui-modal__top">
                <span className="muted">Goals › New goal</span>
                <span className="dots">
                    <i />
                    <i />
                    <i />
                    <i className="on" />
                </span>
            </div>
            <div className="ui-modal__body">
                <small className="mono muted">Step 4 of 4</small>
                <h4>Two ways to shape this</h4>
                <p>Pick the one that fits your life — the plan stays editable either way.</p>
                <div className="ui-path is-selected">
                    <div>
                        <b>Steady sessions</b>
                        <span className="pill pill--neutral">CONSISTENCY</span>
                    </div>
                    <span>4 sessions / week, ramping to 5</span>
                    <p>Fits a week that changes shape — you commit to showing up, not to a clock.</p>
                    <small className="mono muted">
                        Rebuild · 4 sessions / week → Outreach push · 5 sessions / week
                    </small>
                </div>
                <div className="ui-path">
                    <div>
                        <b>Weekly hours</b>
                        <span className="pill pill--neutral">TIME-BASED</span>
                    </div>
                    <span>6 hrs / week against the plan</span>
                    <p>Fits deep-work blocks — credit the hours whenever they happen.</p>
                    <small className="mono muted">Rebuild · 6 hrs / week → Outreach push · 5 hrs / week</small>
                </div>
            </div>
            <div className="ui-modal__foot">
                <span>Back</span>
                <span className="ui-btn-dark">
                    Create goal <em className="mono">⌘↩</em>
                </span>
            </div>
        </div>
    </Shot>
)

export default NewGoalShot
