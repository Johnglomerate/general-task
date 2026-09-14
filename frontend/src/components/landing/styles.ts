import styled, { createGlobalStyle, css } from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { LANDING_BREAKPOINTS, LANDING_CONTAINER_WIDTH } from '../../styles/dimensions'

const EASE = 'cubic-bezier(.2,.7,.2,1)'
const CARD_STROKE = 'rgba(182,182,182,.6)'

export const LandingGlobalStyle = createGlobalStyle`
    html {
        scroll-behavior: smooth;
    }
    @media (prefers-reduced-motion: reduce) {
        html {
            scroll-behavior: auto;
        }
    }
`

const landingCss = css`
    box-sizing: border-box;
    min-width: 100%;
    min-height: 100vh;
    overflow-x: hidden;
    background: ${Colors.background.page};
    color: ${Colors.text.ink};
    font-family: ${Typography.fontFamily.sans};
    font-size: 16px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;

    *,
    *::before,
    *::after {
        box-sizing: border-box;
    }
    a {
        color: inherit;
        text-decoration: none;
    }
    img,
    svg {
        max-width: 100%;
        display: block;
    }
    button {
        font-family: inherit;
    }

    .gt-container {
        max-width: ${LANDING_CONTAINER_WIDTH};
        margin: 0 auto;
        padding: 0 ${Spacing._24};
    }
    .mono {
        font-family: ${Typography.fontFamily.mono};
    }
    .muted {
        color: ${Colors.text.muted};
    }
    h1,
    h2,
    h3,
    h4,
    h5 {
        margin: 0;
        font-weight: 500;
        letter-spacing: -0.01em;
    }
    h1 {
        font-size: clamp(40px, 5vw, 64px);
        line-height: 1.04;
        letter-spacing: -0.02em;
    }
    h2 {
        font-size: clamp(28px, 3.2vw, 36px);
        line-height: 1.2;
    }
    h3 {
        font-size: clamp(28px, 3.4vw, 40px);
        line-height: 1.15;
    }
    p {
        margin: 0;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 14px 22px;
        border-radius: ${Border.radius.medium};
        font-weight: 500;
        font-size: 16px;
        line-height: 1;
        border: 1px solid transparent;
        box-shadow: ${Shadows.button.default};
        transition: transform 0.25s ${EASE}, box-shadow 0.25s ${EASE}, background 0.2s;
    }
    .btn--primary {
        background: ${Colors.accent.yellow};
        border-color: ${Colors.accent.yellowStroke};
        color: ${Colors.text.ink};
    }
    .btn--secondary {
        background: ${Colors.background.white};
        border-color: ${Colors.background.border};
        color: ${Colors.text.ink};
        box-shadow: ${Shadows.button.secondary};
    }
    .btn:hover {
        transform: translateY(-1px);
        box-shadow: ${Shadows.button.hover};
    }
    .btn:active {
        transform: translateY(0);
    }
    .btn--sm {
        padding: 12px 20px;
        font-size: 15px;
    }

    .nav {
        position: sticky;
        top: 0;
        z-index: 50;
        background: ${Colors.background.page};
        background: color-mix(in srgb, ${Colors.background.page} 82%, transparent);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }
    .nav__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 20px;
        padding-bottom: 20px;
        gap: ${Spacing._24};
    }
    .logo {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        font-size: 18px;
    }
    .logo__mark {
        width: 30px;
        height: auto;
        display: block;
    }
    .nav__links {
        display: flex;
        gap: ${Spacing._32};
        font-weight: 500;
        font-size: 15px;
    }
    .nav__links a {
        opacity: 0.9;
        transition: opacity 0.2s;
    }
    .nav__links a:hover {
        opacity: 1;
    }
    .nav__actions {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .nav__login {
        font-weight: 500;
        font-size: 15px;
        margin-right: 4px;
    }
    .nav__burger {
        display: none;
        width: 40px;
        height: 40px;
        border: 1px solid ${Colors.background.border};
        background: ${Colors.background.white};
        border-radius: ${Border.radius.medium};
        flex-direction: column;
        justify-content: center;
        gap: 5px;
        align-items: center;
        cursor: pointer;
        padding: 0;
    }
    .nav__burger span {
        width: 16px;
        height: 1.5px;
        background: ${Colors.text.ink};
        transition: transform 0.25s ${EASE};
    }
    .nav__burger[aria-expanded='true'] span:first-child {
        transform: translateY(3.25px) rotate(45deg);
    }
    .nav__burger[aria-expanded='true'] span:last-child {
        transform: translateY(-3.25px) rotate(-45deg);
    }

    .hero {
        position: relative;
        overflow: hidden;
        padding: 229px 0 230px;
    }
    .backdrop {
        position: absolute;
        inset: 0 0 auto 0;
        height: 1500px;
        pointer-events: none;
        z-index: 0;
    }
    .backdrop__wash {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, #fff3d6 0%, #fbf4ea 55%, ${Colors.background.page} 100%);
    }
    .blob {
        position: absolute;
        border-radius: 50%;
        filter: blur(120px);
        will-change: transform;
        animation: gtl-drift 22s ease-in-out infinite alternate;
    }
    .blob--yellow {
        width: 1100px;
        height: 620px;
        left: -320px;
        top: -360px;
        background: ${Colors.accent.yellow};
        opacity: 0.4;
    }
    .blob--amber {
        width: 900px;
        height: 520px;
        left: 520px;
        top: -180px;
        background: #f2b26b;
        opacity: 0.26;
        animation-duration: 28s;
        animation-delay: -8s;
    }
    .blob--pink {
        width: 760px;
        height: 560px;
        left: 820px;
        top: -40px;
        background: ${Colors.accent.pink};
        opacity: 0.08;
        animation-duration: 26s;
        animation-delay: -14s;
    }
    .blob--sky {
        width: 1500px;
        height: 520px;
        left: -60px;
        top: 700px;
        background: ${Colors.background.band};
        opacity: 0.6;
        animation-duration: 30s;
    }
    .backdrop__fade {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 520px;
        background: linear-gradient(180deg, rgba(247, 245, 242, 0), ${Colors.background.page});
    }
    @keyframes gtl-drift {
        from {
            transform: translate3d(0, 0, 0) scale(1);
        }
        to {
            transform: translate3d(40px, 24px, 0) scale(1.06);
        }
    }
    .sundial {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        opacity: 0.9;
    }
    .sundial svg {
        width: 100%;
        height: 100%;
        max-width: none;
    }
    .hero__inner {
        position: relative;
        z-index: 2;
        display: grid;
        grid-template-columns: 1fr;
        gap: 56px;
        align-items: start;
    }
    .hero__copy {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: ${Spacing._24};
        max-width: 726px;
    }
    .hero__inner h1 {
        font-size: 48px;
        font-weight: 500;
        line-height: 1.04;
        letter-spacing: -0.02em;
    }
    .hero__sub {
        font-size: 16px;
        line-height: 1.4;
        color: ${Colors.text.secondary};
        max-width: 460px;
    }
    .hero__ctas {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
    }
    .hero__shot {
        min-width: 0;
        width: 788px;
        max-width: 100%;
    }
    .shot--hero {
        width: 100%;
        max-width: 788px;
        margin: 0;
        aspect-ratio: 788 / 466;
        border-radius: ${Border.radius.xl};
    }
    .shot--hero .shot__inner {
        width: 820px;
        height: 485px;
    }

    [data-reveal],
    [data-stagger] {
        opacity: 0;
        transform: translateY(18px);
        transition: opacity 0.7s ${EASE}, transform 0.7s ${EASE};
        transition-delay: var(--delay, 0s);
    }
    [data-reveal].is-in,
    [data-stagger].is-in {
        opacity: 1;
        transform: none;
    }

    .ps {
        padding: 112px 0;
    }
    .ps__grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 80px;
    }
    .ps__list {
        list-style: none;
        margin: ${Spacing._32} 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .ps__list li {
        display: flex;
        gap: 14px;
        align-items: flex-start;
        font-size: 18px;
        font-weight: 500;
        line-height: 1.4;
        max-width: 460px;
    }
    .ps__list i {
        flex: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-style: normal;
        font-weight: 700;
        font-size: 14px;
        color: #fff;
        background: ${Colors.text.secondary};
        margin-top: -1px;
    }
    .ps__list--check i {
        background: ${Colors.accent.pink};
    }

    .testimonials {
        padding: 96px 0;
    }
    .tcards {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: ${Spacing._24};
    }
    .tcard {
        margin: 0;
        background: ${Colors.background.white};
        border: 1px solid ${CARD_STROKE};
        border-radius: ${Border.radius.large};
        padding: ${Spacing._32};
        display: flex;
        flex-direction: column;
        gap: ${Spacing._24};
    }
    .tcard blockquote {
        margin: 0;
        font-size: 17px;
        line-height: 1.5;
    }
    .tcard figcaption {
        display: flex;
        gap: 12px;
        align-items: center;
    }
    .tcard figcaption b {
        display: block;
        font-weight: 600;
        font-size: 15px;
    }
    .tcard figcaption em {
        font-style: normal;
        font-size: 13px;
        color: ${Colors.text.secondary};
    }
    .avatar {
        flex: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-weight: 600;
        font-size: 13px;
        color: ${Colors.text.title};
    }
    .tnav {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-top: 40px;
    }
    .tnav button {
        width: 40px;
        height: 40px;
        padding: 0;
        border-radius: 50%;
        border: 1px solid ${Colors.background.divider};
        background: ${Colors.background.white};
        cursor: pointer;
        font-size: 16px;
        display: grid;
        place-items: center;
        transition: transform 0.2s ${EASE};
    }
    .tnav button:hover {
        transform: translateY(-1px);
    }

    .features {
        padding: ${Spacing._64} 0;
    }
    .frow {
        display: grid;
        grid-template-columns: 1fr 560px;
        gap: 80px;
        align-items: center;
        padding: ${Spacing._64} 0;
    }
    .frow--flip {
        grid-template-columns: 560px 1fr;
    }
    .frow--flip .frow__copy {
        order: 2;
    }
    .frow--flip .frow__shot {
        order: 1;
    }
    .frow__copy {
        display: flex;
        flex-direction: column;
        gap: 20px;
        max-width: 480px;
    }
    .frow__copy p {
        font-size: 18px;
        line-height: 1.5;
        color: ${Colors.text.secondary};
    }
    .eyebrow {
        font-family: ${Typography.fontFamily.mono};
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.08em;
        color: ${Colors.accent.pink};
    }
    .eyebrow--sm {
        font-size: 10px;
    }
    .frow__rule {
        border: 0;
        border-top: 1px solid ${Colors.background.divider};
        margin: 0;
    }
    .frow__note {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-top: 20px;
        padding: 14px 16px;
        border-radius: 12px;
        background: ${Colors.background.white};
        border: 1px solid ${Colors.background.border};
        font-size: 15px;
        line-height: 1.5;
        color: ${Colors.text.secondary};
    }
    .gcal {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: ${Colors.text.ink};
        white-space: nowrap;
    }
    .gcal b {
        width: 28px;
        height: 28px;
        border-radius: ${Border.radius.medium};
        background: #4285f4;
        color: #fff;
        display: grid;
        place-items: center;
        font-size: 13px;
        font-weight: 700;
    }

    .closing {
        padding: 128px 0;
        text-align: center;
    }
    .closing .gt-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: ${Spacing._32};
    }
    .closing__h {
        font-size: clamp(40px, 4.5vw, 56px);
        line-height: 1.1;
        letter-spacing: -0.02em;
    }
    .closing p {
        font-size: 20px;
        line-height: 1.5;
        color: ${Colors.text.secondary};
        max-width: 560px;
    }
    .footer {
        background: ${Colors.background.white};
        border-top: 1px solid #000;
        padding: ${Spacing._64} 0 40px;
    }
    .footer__cols {
        display: flex;
        justify-content: space-between;
        gap: ${Spacing._64};
        flex-wrap: wrap;
    }
    .footer__brand {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .footer__brand p {
        font-size: 14px;
        color: ${Colors.text.secondary};
    }
    .footer__col {
        display: flex;
        flex-direction: column;
        gap: 12px;
        font-size: 14px;
        font-family: ${Typography.fontFamily.mono};
    }
    .footer__col b {
        font-weight: 500;
        color: ${Colors.text.ink};
    }
    .footer__col a,
    .footer__col span {
        color: ${Colors.text.secondary};
    }
    .footer__legal {
        display: flex;
        justify-content: space-between;
        margin-top: 48px;
        font-size: 13px;
        color: ${Colors.text.secondary};
    }
    .footer__legal a {
        margin-left: ${Spacing._24};
    }

    .shot {
        position: relative;
        width: 100%;
        border-radius: ${Border.radius.large};
        overflow: hidden;
        background: ${Colors.background.white};
        border: 1px solid ${CARD_STROKE};
        box-shadow: ${Shadows.card};
    }
    .shot--card {
        aspect-ratio: 560 / 420;
        border-radius: ${Border.radius.large};
        box-shadow: none;
        border-color: ${Colors.background.divider};
    }
    .shot__inner {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: top left;
        width: 560px;
        height: 420px;
        font-size: 13px;
        line-height: 1.4;
        color: ${Colors.text.title};
    }
    .ui {
        display: flex;
    }
    .ui .mono {
        font-family: ${Typography.fontFamily.mono};
    }
    .ui-label {
        font-size: 10px;
        font-weight: 500;
        color: ${Colors.text.muted};
        letter-spacing: 0.04em;
    }
    .pill {
        display: inline-flex;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 500;
        border: 1px solid;
        white-space: nowrap;
    }
    .pill--ok {
        color: #15803d;
        background: #f0fdf4;
        border-color: #86efac;
    }
    .pill--bad {
        color: #be0a16;
        background: #fef2f2;
        border-color: #fca5a5;
    }
    .pill--warn {
        color: #a16207;
        background: #fefce8;
        border-color: #fde68a;
    }
    .pill--neutral {
        color: ${Colors.text.base};
        background: ${Colors.background.sub};
        border-color: ${Colors.background.border};
    }
    .bar {
        height: 4px;
        border-radius: 2px;
        background: ${Colors.background.border};
        overflow: hidden;
    }
    .bar i {
        display: block;
        height: 100%;
        width: var(--p);
        background: ${Colors.text.title};
        border-radius: 2px;
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 1.1s ${EASE} 0.2s;
    }
    .is-in .bar i {
        transform: scaleX(1);
    }
    .strip {
        display: flex;
        gap: 4px;
    }
    .strip i {
        width: 18px;
        height: 13px;
        border-radius: 3px;
        background: ${Colors.background.sub};
        transition: background 0.4s ${EASE};
    }
    .strip i.on {
        background: #27272a;
    }
    .strip--lg i {
        width: 22px;
        height: 16px;
    }

    .ui--goals .ui-sidebar {
        width: 172px;
        flex: none;
        background: ${Colors.background.panel};
        border-right: 1px solid ${Colors.background.border};
        padding: 16px 12px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .ui-brand {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 6px 14px;
        font-size: 10px;
        color: ${Colors.text.muted};
    }
    .ui-brand__g {
        width: 26px;
        height: auto;
        display: block;
    }
    .ui-nav {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .ui-nav span {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 6px;
        font-size: 12px;
        color: ${Colors.text.base};
    }
    .ui-nav span.is-active {
        background: #efeff1;
        color: ${Colors.text.title};
        font-weight: 500;
    }
    .ui-nav i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #a1a1aa;
    }
    .ui-nav .is-active i {
        background: ${Colors.text.title};
    }
    .ui--goals .ui-label {
        padding: 10px 8px 2px;
    }
    .ui-list {
        width: 340px;
        flex: none;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .ui-list__head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 16px;
    }
    .ui-list__head strong {
        font-weight: 600;
    }
    .ui-list__head span {
        font-size: 12px;
    }
    .ui-pulse {
        display: flex;
        gap: 6px;
        overflow: hidden;
    }
    .ui-pulse span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 8px;
        border-radius: 999px;
        background: ${Colors.background.sub};
        font-size: 11px;
        white-space: nowrap;
    }
    .ui-pulse i {
        width: 6px;
        height: 6px;
        border-radius: 50%;
    }
    .ui-pulse em {
        font-style: normal;
        font-size: 10px;
        color: ${Colors.text.muted};
    }
    .ui-goal {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 10px;
        border-radius: 6px;
    }
    .ui-goal.is-selected {
        background: ${Colors.background.sub};
    }
    .ui-goal > div:first-child {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        font-weight: 500;
    }
    .ui-goal small {
        font-size: 11px;
        color: ${Colors.text.muted};
    }
    .ui-details {
        flex: 1;
        min-width: 0;
        border-left: 1px solid ${Colors.background.border};
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .ui-details__head {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .ui-details h4 {
        font-size: 16px;
        font-weight: 600;
        line-height: 1.25;
    }
    .ui-details p {
        font-size: 12px;
        color: ${Colors.text.base};
    }
    .ui hr {
        border: 0;
        border-top: 1px solid ${Colors.background.hairline};
        margin: 0;
    }
    .ui-details dl {
        margin: 0;
        display: grid;
        grid-template-columns: 76px 1fr;
        gap: 8px;
        font-size: 12px;
    }
    .ui-details dt {
        color: ${Colors.text.muted};
    }
    .ui-details dd {
        margin: 0;
    }
    .ui-progress {
        display: flex;
        align-items: baseline;
        gap: 8px;
    }
    .ui-progress strong {
        font-size: 14px;
        font-weight: 600;
    }
    .ui-progress span {
        font-size: 11px;
    }
    .ui-contrib {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 12px;
        color: ${Colors.text.base};
    }
    .ui-contrib li {
        display: flex;
        justify-content: space-between;
        gap: 8px;
    }
    .ui-contrib em {
        font-style: normal;
        font-size: 11px;
        color: ${Colors.text.muted};
        white-space: nowrap;
    }
    .ui-week {
        font-size: 11px;
        color: ${Colors.text.muted};
    }
    .ui--goals .strip--weeks {
        gap: 3px;
    }
    .ui--goals .strip--weeks i {
        flex: 1 1 0;
        width: auto;
        min-width: 0;
        height: 12px;
        transition: background 0.35s ${EASE}, opacity 0.35s ${EASE}, box-shadow 0.35s ${EASE};
    }
    .ui--goals .strip--weeks i.future {
        opacity: 0.4;
    }
    .ui--goals .strip--weeks i.now {
        box-shadow: inset 0 0 0 1px ${Colors.accent.pink};
    }
    .ui--goals .bar i {
        transition: transform 1.1s ${EASE} 0.2s, width 0.4s ${EASE};
    }
    .ui-contrib li.is-new {
        animation: gtl-contrib-in 0.5s ${EASE};
    }
    @keyframes gtl-contrib-in {
        from {
            opacity: 0;
            transform: translateY(-5px);
        }
        to {
            opacity: 1;
            transform: none;
        }
    }

    .ui--center {
        align-items: center;
        justify-content: center;
    }
    .ui-modal {
        width: 500px;
        transform: scale(0.88);
        background: #fff;
        border: 1px solid ${Colors.background.border};
        border-radius: 10px;
        box-shadow: ${Shadows.modal};
        display: flex;
        flex-direction: column;
    }
    .ui-modal__top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid ${Colors.background.hairline};
        font-size: 12px;
    }
    .dots {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    .dots i {
        width: 5px;
        height: 5px;
        border-radius: 3px;
        background: #a1a1aa;
    }
    .dots i.on {
        width: 14px;
        background: ${Colors.text.title};
    }
    .ui-modal__body {
        padding: 14px 16px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .ui-modal__body small {
        font-size: 11px;
    }
    .ui-modal__body h4 {
        font-size: 15px;
        font-weight: 600;
    }
    .ui-modal__body > p {
        font-size: 12px;
        color: ${Colors.text.base};
    }
    .ui-path {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 10px 12px;
        border-radius: 8px;
        background: ${Colors.background.sub};
        font-size: 12px;
    }
    .ui-path.is-selected {
        background: #fff;
        border: 1.5px solid ${Colors.text.title};
    }
    .ui-path > div {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .ui-path b {
        font-size: 13px;
        font-weight: 600;
    }
    .ui-path p {
        color: ${Colors.text.base};
    }
    .ui-path small {
        font-size: 11px;
    }
    .ui-modal__foot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 16px;
        font-size: 12px;
        color: ${Colors.text.base};
    }
    .ui-btn-dark {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        padding: 7px 12px;
        border-radius: 6px;
        background: ${Colors.text.title};
        color: #fff;
        font-weight: 500;
    }
    .ui-btn-dark em {
        font-style: normal;
        font-size: 11px;
        color: #a1a1aa;
    }

    .ui--progress {
        display: block;
    }
    .ui-det {
        padding: 22px 24px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .ui-det h4 {
        font-size: 16px;
        font-weight: 600;
    }
    .ui-det small {
        font-size: 11px;
    }
    .weeks {
        display: flex;
        gap: 5px;
        font-size: 9px;
        color: #a1a1aa;
    }
    .weeks span {
        width: 22px;
        overflow: hidden;
        white-space: nowrap;
    }
    .weeks .now {
        color: ${Colors.accent.pink};
    }
    .ui-repair {
        position: absolute;
        right: 24px;
        bottom: 20px;
        width: 400px;
        background: #fff;
        border: 1px solid ${Colors.background.border};
        border-radius: 10px;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: ${Shadows.modal};
    }
    .ui-repair h5 {
        font-size: 14px;
        font-weight: 600;
    }
    .ui-repair p {
        font-size: 12px;
        color: ${Colors.text.base};
    }
    .ui-opt {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 7px 10px;
        border-radius: 6px;
        border: 1px solid ${Colors.background.border};
        font-size: 12px;
    }
    .ui-opt.is-selected {
        background: ${Colors.background.sub};
    }
    .ui-opt b {
        font-weight: 500;
    }
    .ui-opt span {
        font-size: 11px;
        color: ${Colors.text.muted};
    }

    .ui--cal {
        display: block;
    }
    .ui-cal__head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        font-weight: 600;
    }
    .ui-cal__head span {
        font-size: 11px;
        font-weight: 400;
    }
    .ui-cal__grid {
        position: relative;
    }
    .hour {
        position: relative;
        height: 52px;
        border-top: 1px solid ${Colors.background.hairline};
        font-size: 10px;
        color: ${Colors.text.muted};
    }
    .hour > span {
        position: absolute;
        left: 12px;
        top: 4px;
    }
    .hour.now::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 18px;
        height: 2px;
        background: ${Colors.accent.pink};
    }
    .hour.now::before {
        content: '';
        position: absolute;
        left: 0;
        top: 15px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${Colors.accent.pink};
        z-index: 1;
    }
    .ev {
        position: absolute;
        left: 70px;
        width: 470px;
        padding: 6px 10px;
        border-radius: 6px;
        background: ${Colors.background.sub};
        border: 1px solid ${Colors.background.border};
        font-size: 12px;
        font-weight: 500;
        color: ${Colors.text.title};
        font-family: ${Typography.fontFamily.sans};
        display: flex;
        flex-direction: column;
        gap: 1px;
    }
    .ev small {
        font-size: 10px;
        font-weight: 400;
        color: ${Colors.text.muted};
    }
    .hour:nth-child(2) .ev {
        top: 4px;
        height: 26px;
        overflow: hidden;
    }
    .slot {
        position: absolute;
        left: 70px;
        top: 4px;
        width: 470px;
        height: 52px;
        border-radius: 6px;
        background: rgba(251, 221, 64, 0.25);
        border: 1px dashed ${Colors.accent.yellowStroke};
    }
    .ev--drag {
        left: 96px;
        top: 12px;
        width: 440px;
        height: 52px;
        background: #fff;
        transform: rotate(-1.5deg);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 12px 28px rgba(0, 0, 0, 0.12);
        justify-content: center;
        animation: gtl-hover 4s ease-in-out infinite;
    }
    @keyframes gtl-hover {
        0%,
        100% {
            transform: rotate(-1.5deg) translateY(0);
        }
        50% {
            transform: rotate(-1.2deg) translateY(-3px);
        }
    }
    .cursor {
        position: absolute;
        left: 330px;
        top: 44px;
    }

    .ui--kit {
        display: block;
    }
    .ui-ov {
        position: absolute;
        left: 20px;
        top: 22px;
        width: 400px;
        background: #fff;
        border: 1px solid ${Colors.background.border};
        border-radius: 8px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .ui-ov strong {
        font-size: 14px;
        font-weight: 600;
    }
    .ui-ov__folder {
        padding: 8px 0 6px;
        font-size: 12px;
        font-weight: 500;
    }
    .ui-ov__folder em {
        font-style: normal;
        font-size: 10px;
        color: ${Colors.text.muted};
        margin-left: 8px;
    }
    .ui-task {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 7px 8px;
        border-radius: 6px;
        font-size: 12px;
    }
    .ui-task.is-selected {
        background: ${Colors.background.sub};
    }
    .ui-task span {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .ui-task i {
        width: 12px;
        height: 12px;
        border-radius: 3px;
        border: 1px solid #d4d4d8;
        background: #fff;
    }
    .ui-task em {
        font-style: normal;
        font-size: 11px;
        color: ${Colors.text.muted};
        white-space: nowrap;
    }
    .ui-focus {
        position: absolute;
        left: 270px;
        top: 150px;
        width: 272px;
        background: #fff;
        border: 1px solid ${Colors.background.border};
        border-radius: 10px;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 12px 28px rgba(0, 0, 0, 0.12);
    }
    .ui-focus h5 {
        font-size: 14px;
        font-weight: 600;
        line-height: 1.25;
    }
    .ui-focus small {
        font-size: 11px;
    }
    .ui-focus__t {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-top: 4px;
    }
    .ui-focus__t b {
        font-size: 24px;
        font-weight: 500;
    }
    .ui-focus__t span {
        font-size: 11px;
    }
    .ui-cmd {
        position: absolute;
        left: 140px;
        top: 236px;
        width: 300px;
        background: #fff;
        border: 1px solid ${Colors.background.border};
        border-radius: 10px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 12px 28px rgba(0, 0, 0, 0.12);
    }
    .ui-cmd__in {
        display: flex;
        gap: 8px;
        align-items: center;
        padding: 10px 14px;
        border-bottom: 1px solid ${Colors.background.hairline};
        font-size: 12px;
        color: #a1a1aa;
    }
    .ui-cmd__in em {
        font-style: normal;
        font-size: 10px;
    }
    .ui-cmd__list {
        padding: 6px 8px 8px;
        display: flex;
        flex-direction: column;
        gap: 1px;
    }
    .ui-cmd__list small {
        font-size: 9px;
        font-weight: 500;
        color: ${Colors.text.muted};
        padding: 2px 8px;
    }
    .ui-cmd__list div {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 8px;
        border-radius: 6px;
        font-size: 12px;
    }
    .ui-cmd__list div.is-selected {
        background: ${Colors.background.sub};
    }
    .ui-cmd kbd {
        font-family: ${Typography.fontFamily.mono};
        font-size: 10px;
        color: ${Colors.text.muted};
        background: ${Colors.background.sub};
        border: 1px solid ${Colors.background.border};
        border-radius: 4px;
        padding: 1px 5px;
    }

    @media (max-width: ${LANDING_BREAKPOINTS.wide}px) {
        .hero {
            padding: 160px 0 140px;
        }
        .hero__shot {
            width: 100%;
        }
        .frow,
        .frow--flip {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 48px 0;
        }
        .frow--flip .frow__copy {
            order: 1;
        }
        .frow--flip .frow__shot {
            order: 2;
        }
        .frow__copy {
            max-width: 640px;
        }
        .tcards {
            grid-template-columns: 1fr;
        }
    }
    @media (max-width: ${LANDING_BREAKPOINTS.medium}px) {
        .nav__links {
            display: none;
            position: absolute;
            left: 0;
            right: 0;
            top: 100%;
            flex-direction: column;
            gap: 0;
            background: ${Colors.background.page};
            border-bottom: 1px solid ${Colors.background.border};
            padding: 8px 24px 16px;
        }
        .nav__links a {
            padding: 12px 0;
        }
        .nav__links.is-open {
            display: flex;
        }
        .nav__login {
            display: none;
        }
        .nav__burger {
            display: flex;
        }
        .hero {
            padding: 72px 0 64px;
        }
        .hero__inner {
            gap: 40px;
        }
        .hero__inner h1 {
            font-size: clamp(34px, 7vw, 44px);
        }
        .sundial svg {
            opacity: 0.55;
        }
        .ps {
            padding: 72px 0;
        }
        .ps__grid {
            grid-template-columns: 1fr;
            gap: 48px;
        }
        .testimonials {
            padding: 64px 0;
        }
        .closing {
            padding: 96px 0;
        }
        .footer__cols {
            gap: 32px;
        }
        .footer__legal {
            flex-direction: column;
            gap: 12px;
        }
        .footer__legal a {
            margin: 0 24px 0 0;
        }
    }
    @media (max-width: ${LANDING_BREAKPOINTS.small}px) {
        .btn {
            width: 100%;
        }
        .hero__ctas {
            width: 100%;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        [data-reveal],
        [data-stagger] {
            opacity: 1;
            transform: none;
            transition: none;
        }
        .blob {
            animation: none;
        }
        .bar i {
            transition: none;
        }
        .ui-contrib li.is-new {
            animation: none;
        }
        .ui--goals .strip--weeks i,
        .ui--goals .bar i {
            transition: none;
        }
        .ev--drag {
            animation: none;
        }
    }
`

export const LandingRoot = styled.div`
    ${landingCss}
`
