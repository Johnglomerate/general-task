import { CSSProperties } from 'react'

const TESTIMONIALS = [
    {
        quote: '“I had ‘rebuild my portfolio’ on a list for a year. General Task asked how many hours I actually had, built a plan around six, and it moved for the first time.”',
        initials: 'AR',
        name: 'Ana Ruiz',
        role: 'Product designer, Lumen',
        avatar: '#DCECF5',
        delay: undefined as string | undefined,
    },
    {
        quote: '“Watching the weekly strip fill in is the first time my small tasks have felt like they counted for something bigger.”',
        initials: 'JM',
        name: 'Jonah Mehta',
        role: 'Founder, Kestrel',
        avatar: '#FBDD40',
        delay: '.1s',
    },
    {
        quote: '“I went off track in March. Instead of a guilt trip I got one dialog, my own reasons quoted back, and an ‘extend the runway’ button. I kept going.”',
        initials: 'PS',
        name: 'Priya Shah',
        role: 'Engineering lead, Orbit',
        avatar: '#F8D7E4',
        delay: '.2s',
    },
]

const Testimonials = () => (
    <section className="testimonials">
        <div className="gt-container">
            <div className="tcards">
                {TESTIMONIALS.map((card) => (
                    <figure
                        key={card.name}
                        className="tcard"
                        data-reveal
                        style={card.delay ? ({ ['--delay']: card.delay } as CSSProperties) : undefined}
                    >
                        <blockquote>{card.quote}</blockquote>
                        <figcaption>
                            <span className="avatar" style={{ background: card.avatar }}>
                                {card.initials}
                            </span>
                            <span>
                                <b>{card.name}</b>
                                <em className="mono">{card.role}</em>
                            </span>
                        </figcaption>
                    </figure>
                ))}
            </div>
            <div className="tnav" data-reveal>
                <button type="button" aria-label="Previous">
                    ←
                </button>
                <button type="button" aria-label="Next">
                    →
                </button>
            </div>
        </div>
    </section>
)

export default Testimonials
