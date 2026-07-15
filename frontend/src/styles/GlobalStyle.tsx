import { createGlobalStyle } from 'styled-components'
import { Colors } from '.'

const GlobalStyle = createGlobalStyle`
    :root {
       --animate-duration: 250ms !important;
       --animate-border-easing: 150ms ease-out !important;
    }
    html,
    body {
        height: 100%;
        margin: 0;
        padding: 0;
        /* Stop iOS Safari from inflating text in portrait; without this it silently overrides font sizes. */
        -webkit-text-size-adjust: 100%;
        /* Suppress the grey flash iOS paints over every tapped element. */
        -webkit-tap-highlight-color: transparent;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
            Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
    }
    button,
    input,
    textarea {
        font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu, Cantarell,
            Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
    }
    a {
        color: ${Colors.text.purple};
    }
    #event-details-popup {
        position: absolute;
        left: 0px;
        top: 0px;
        z-index: 100;
    }
    .__react_component_tooltip.show {
        opacity: 1 !important;
    }

`

export default GlobalStyle
