import { useRef } from 'react'
import Closing from './Closing'
import Features from './Features'
import Footer from './Footer'
import Hero from './Hero'
import Nav from './Nav'
import ProblemSolution from './ProblemSolution'
import Testimonials from './Testimonials'
import { LandingGlobalStyle, LandingRoot } from './styles'
import { useLandingEffects } from './useLandingEffects'

const LandingPage = () => {
    const rootRef = useRef<HTMLDivElement>(null)
    useLandingEffects(rootRef)

    return (
        <LandingRoot ref={rootRef}>
            <LandingGlobalStyle />
            <Nav />
            <main>
                <Hero />
                <ProblemSolution />
                <Testimonials />
                <Features />
                <Closing />
            </main>
            <Footer />
        </LandingRoot>
    )
}

export default LandingPage
