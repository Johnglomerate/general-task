import DailyToolkit from './DailyToolkit'
import CalendarShot from './shots/CalendarShot'
import NewGoalShot from './shots/NewGoalShot'
import ProgressShot from './shots/ProgressShot'

const Features = () => (
    <section className="features" id="features">
        <div className="gt-container">
            <div className="frow" data-reveal>
                <div className="frow__copy">
                    <span className="eyebrow">GOALS</span>
                    <h3>Turn what you’re aiming for into a weekly plan.</h3>
                    <p>
                        Tell General Task the outcome, why it matters, and the hours you can honestly give it each week.
                        It drafts a plan that fits — steady sessions or weekly hours, in phases when the goal needs a
                        ramp. You edit. You confirm. If the capacity can’t reach the date, it says so and shows what
                        would.
                    </p>
                </div>
                <div className="frow__shot">
                    <NewGoalShot />
                </div>
            </div>

            <hr className="frow__rule" />

            <div className="frow frow--flip" data-reveal>
                <div className="frow__copy">
                    <span className="eyebrow">PROGRESS</span>
                    <h3>Know if it’s adding up — before it’s too late.</h3>
                    <p>
                        The week is the unit. Complete a task that feeds a goal and that week fills. Go quiet and the
                        goal whispers “Behind,” with room to recover. Every goal states its own contract in one plain
                        line — “Counts as off track after 2 quiet weeks.” And when one does go off track, nothing nags:
                        one dialog quotes your own why back to you and offers four ways forward — ease the plan, extend
                        the runway, fresh week, or pause.
                    </p>
                </div>
                <div className="frow__shot">
                    <ProgressShot />
                </div>
            </div>

            <hr className="frow__rule" />

            <div className="frow" data-reveal>
                <div className="frow__copy">
                    <span className="eyebrow">CALENDAR</span>
                    <h3>Set time aside for what you need to do.</h3>
                    <p>
                        Drag any task onto your day and it lands on your Google Calendar. Time you block for a goal’s
                        tasks is time credited to the goal — planning the day and moving the goal are the same motion.
                    </p>
                    <p className="frow__note">
                        <span className="gcal">
                            <b>G</b>Google Calendar
                        </span>
                        Two-way sync. The only connection you need — your meetings show up here, your blocks show up
                        there.
                    </p>
                </div>
                <div className="frow__shot">
                    <CalendarShot />
                </div>
            </div>

            <hr className="frow__rule" />

            <DailyToolkit />
        </div>
    </section>
)

export default Features
