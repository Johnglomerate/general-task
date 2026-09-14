import { Colors } from '../../../styles'
import Shot from './Shot'

const ToolkitShot = () => (
    <Shot variant="card" innerClassName="ui ui--kit" style={{ background: Colors.background.sub }}>
        <div className="ui-ov">
            <strong>Overview</strong>
            <div className="ui-ov__folder">
                ▾ &nbsp;Work <em className="mono">4</em>
            </div>
            <div className="ui-task is-selected">
                <span>
                    <i />
                    Design review: in-stay tipping flow v2
                </span>
                <em className="mono" style={{ color: '#BE0A16' }}>
                    Overdue (Jul 01)
                </em>
            </div>
            <div className="ui-task">
                <span>
                    <i />
                    Follow up on PR #482 review comments
                </span>
                <em className="mono">Jul 02</em>
            </div>
            <div className="ui-task">
                <span>
                    <i />
                    GEN-341: Fix tipping modal focus trap
                </span>
                <em className="mono">Jul 02</em>
            </div>
            <div className="ui-task">
                <span>
                    <i />
                    Prep weekly initiative update
                </span>
                <em className="mono">Jul 06</em>
            </div>
        </div>
        <div className="ui-focus">
            <span className="eyebrow eyebrow--sm">FOCUS MODE</span>
            <h5>Edit Khruangbin set — 40 photos</h5>
            <small className="mono muted">10:30 – 12:00 &nbsp;·&nbsp; Goal: Shoot 12 concerts</small>
            <div className="ui-focus__t">
                <b className="mono">47:12</b>
                <span className="muted">remaining</span>
            </div>
        </div>
        <div className="ui-cmd">
            <div className="ui-cmd__in">
                <em className="mono">⌘K</em>
                <span>Type a command or search…</span>
            </div>
            <div className="ui-cmd__list">
                <small className="mono">TASKS</small>
                <div className="is-selected">
                    <span>Mark as done</span>
                    <kbd>⇧D</kbd>
                </div>
                <div>
                    <span>Move to folder</span>
                    <kbd>⇧M</kbd>
                </div>
                <div>
                    <span>Add to goal…</span>
                    <kbd>⇧G</kbd>
                </div>
                <div>
                    <span>Jump to today</span>
                    <kbd>T</kbd>
                </div>
            </div>
        </div>
    </Shot>
)

export default ToolkitShot
