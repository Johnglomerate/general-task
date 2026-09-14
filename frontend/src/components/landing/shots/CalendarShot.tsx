import { Colors } from '../../../styles'
import Shot from './Shot'

const CalendarShot = () => (
    <Shot variant="card" innerClassName="ui ui--cal" style={{ background: Colors.background.panel }}>
        <div className="ui-cal__head">
            <strong>Thu, September 3</strong>
            <span className="muted">
                <b className="pill pill--neutral">Google Calendar · synced</b>
            </span>
        </div>
        <div className="ui-cal__grid">
            <div className="hour mono">
                <span>8 am</span>
            </div>
            <div className="hour mono">
                <span>9 am</span>
                <div className="ev">
                    Design sync<small className="mono">9:00 – 9:30</small>
                </div>
            </div>
            <div className="hour mono">
                <span>10 am</span>
            </div>
            <div className="hour mono now">
                <span>11 am</span>
            </div>
            <div className="hour mono">
                <span>12 pm</span>
                <div className="slot" />
                <div className="ev ev--drag">
                    Edit Khruangbin set — 40 photos
                    <small className="mono">Goal · Shoot 12 concerts &nbsp;·&nbsp; 1 h 30 m</small>
                </div>
                <svg className="cursor" width="18" height="20" viewBox="0 0 18 20">
                    <path
                        d="M2 2 L2 16 L6 12.5 L9 19 L11.5 18 L8.5 11.5 L14 11.5 Z"
                        fill="#18181B"
                        stroke="#fff"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            <div className="hour mono">
                <span>1 pm</span>
            </div>
            <div className="hour mono">
                <span>2 pm</span>
            </div>
        </div>
    </Shot>
)

export default CalendarShot
