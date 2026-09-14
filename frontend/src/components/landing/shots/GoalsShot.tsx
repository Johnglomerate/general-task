import { CSSProperties, useEffect, useRef } from 'react'
import { logos } from '../../../styles/images'
import {
    HERO_GOALS,
    STATUS,
    expectedAt,
    formatWeekLabel,
    recentContributions,
    shortDate,
    statusAt,
    valueAt,
    valueLabel,
    weekCellsAt,
} from './goalsMock'
import Shot from './Shot'

type GoalsShotProps = {
    date: Date
}

const barStyle = (pct: number) => ({ ['--p']: `${pct}%` } as CSSProperties)

const GoalsShot = ({ date }: GoalsShotProps) => {
    const detailsGoal = HERO_GOALS[0]
    const detailsValue = valueAt(detailsGoal, date)
    const detailsExpected = expectedAt(detailsGoal, date)
    const detailsStatus = statusAt(detailsGoal, date, detailsValue, detailsExpected)
    const detailsPct = Math.round((detailsValue / detailsGoal.target) * 100)
    const contrib = recentContributions(detailsGoal, date)
    const weeks = weekCellsAt(detailsGoal, date)
    const lastCount = useRef(-1)
    const grew = detailsValue > lastCount.current && lastCount.current >= 0
    useEffect(() => {
        lastCount.current = detailsValue
    }, [detailsValue])

    const pace =
        detailsStatus === 'done'
            ? `Finished ${shortDate(detailsGoal.done[detailsGoal.target - 1][0])} · ${detailsGoal.target} of ${
                  detailsGoal.target
              }`
            : `Expected ~${Math.max(1, Math.round(detailsExpected))} by today · you’re at ${detailsValue}`

    return (
        <Shot variant="hero" innerClassName="ui ui--goals">
            <aside className="ui-sidebar">
                <div className="ui-brand">
                    <img className="ui-brand__g" src={logos.generaltask_mark} alt="" />
                </div>
                <div className="ui-nav">
                    <span>
                        <i />
                        Overview
                    </span>
                    <span className="is-active">
                        <i />
                        Goals
                    </span>
                    <span>
                        <i />
                        Recurring tasks
                    </span>
                    <span>
                        <i />
                        Notes
                    </span>
                    <span>
                        <i />
                        Enter Focus Mode
                    </span>
                </div>
            </aside>
            <div className="ui-list">
                <div className="ui-list__head">
                    <strong>Goals</strong>
                    <span className="ui-week mono">{formatWeekLabel(date)}</span>
                    <span className="muted">+ New goal</span>
                </div>
                <div className="ui-pulse">
                    {HERO_GOALS.filter((goal) => goal.pulse).map((goal) => {
                        const v = valueAt(goal, date)
                        const st = statusAt(goal, date)
                        return (
                            <span key={goal.id}>
                                <i style={{ background: STATUS[st][2] }} />
                                {goal.pulse}{' '}
                                <em className="mono">
                                    {valueLabel(goal, v)} · {STATUS[st][0]}
                                </em>
                            </span>
                        )
                    })}
                </div>
                {HERO_GOALS.map((goal) => {
                    const v = valueAt(goal, date)
                    const st = statusAt(goal, date)
                    const pct = Math.round((v / goal.target) * 100)
                    return (
                        <div key={goal.id} className={`ui-goal${goal.id === 'a' ? ' is-selected' : ''}`}>
                            <div>
                                <span>{goal.title}</span>
                                <b className={`pill pill--${STATUS[st][1]}`}>{STATUS[st][0]}</b>
                            </div>
                            <div className="bar">
                                <i style={barStyle(pct)} />
                            </div>
                            <small className="mono">
                                {valueLabel(goal, v)} · {goal.sub}
                            </small>
                        </div>
                    )
                })}
            </div>
            <div className="ui-details">
                <div className="ui-details__head">
                    <span className="mono ui-label">GOAL</span>
                    <b className={`pill pill--${STATUS[detailsStatus][1]}`}>{STATUS[detailsStatus][0]}</b>
                </div>
                <h4>Shoot 12 concerts this fall</h4>
                <p>Keep the photography practice alive through the fall run — consistent reps, not bursts.</p>
                <hr />
                <dl>
                    <dt>Timeframe</dt>
                    <dd>Sep 1 – Dec 31</dd>
                    <dt>Target</dt>
                    <dd>12 completed shoots</dd>
                    <dt>Pace</dt>
                    <dd>{pace}</dd>
                </dl>
                <small className="mono muted">Counts as off track after 1 quiet week.</small>
                <hr />
                <div className="ui-progress">
                    <strong>
                        {detailsValue} of {detailsGoal.target}
                    </strong>
                    <span className="muted">{detailsPct}% complete</span>
                </div>
                <div className="bar">
                    <i style={barStyle(detailsPct)} />
                </div>
                <div className="strip strip--weeks">
                    {weeks.map((week, i) => (
                        <i
                            key={i}
                            className={`${week.on ? 'on' : ''} ${week.now ? 'now' : ''} ${
                                week.future ? 'future' : ''
                            }`.trim()}
                        />
                    ))}
                </div>
                <div className="mono ui-label">RECENT CONTRIBUTIONS</div>
                <ul className="ui-contrib">
                    {contrib.map((item, i) => (
                        <li
                            key={`${item.date.toISOString()}-${item.text}`}
                            className={grew && i === 0 ? 'is-new' : undefined}
                        >
                            <span>✓ {item.text}</span>
                            <em className="mono">{shortDate(item.date)}</em>
                        </li>
                    ))}
                </ul>
            </div>
        </Shot>
    )
}

export default GoalsShot
