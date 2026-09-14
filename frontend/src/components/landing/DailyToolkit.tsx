import ToolkitShot from './shots/ToolkitShot'

const DailyToolkit = () => (
    <div className="frow frow--flip" data-reveal>
        <div className="frow__copy">
            <span className="eyebrow">THE DAILY TOOLKIT</span>
            <h3>Everything else you need to get through the day.</h3>
            <p>
                Overview — all your most important tasks at a glance, with today’s meetings from Google Calendar right
                beside them.
            </p>
            <p>
                Focus Mode — one task at a time. A single distraction can take up to 23 minutes to fully recover from,
                so we give you a room with nothing else in it.
            </p>
            <p>
                Quick Command — take shortcuts with a few simple keystrokes. Over time, the interface can be learned to
                be played like a fine instrument.
            </p>
        </div>
        <div className="frow__shot">
            <ToolkitShot />
        </div>
    </div>
)

export default DailyToolkit
