import {ReactElement} from "react";
import {keyframes, styled} from "~/stitches.config";

const rotate = keyframes({
    to: {
        transform: "rotate(360deg)"
    }
});

const loadIn = keyframes({
    from: {
        transform: "rotate(50deg)",
        opacity: 0,
        strokeDashoffset: 60
    },
    to: {
        transform: "rotate(180deg)",
        opacity: 1,
        strokeDashoffset: 50
    }
});

const Wrapper = styled("span", {
    display: "inline-flex",
    verticalAlign: "middle",
    animation: `${rotate} 0.85s infinite`,
    // slows down but doesn't stop
    animationTimingFunction: "cubic-bezier(.2,.4,.8,.6)",
    transformOrigin: "center",
    width: "1em",
    height: "1em"
});

Wrapper.displayName = "Wrapper";

const Svg = styled("svg", {
    animation: `${loadIn} 0.5s ease-in-out`,
    animationFillMode: "forwards",
    opacity: 0
});

Svg.displayName = "Svg";

const Circle = styled("circle", {
    fill: "none",
    stroke: "currentColor",
    strokeDasharray: 60,
    strokeDashoffset: "inherit",
    strokeLinecap: "round",
    strokeWidth: 1.5
});

Circle.displayName = "Circle";

export function Spinner(): ReactElement {
    return (
        <Wrapper>
            <Svg width="1em" height="1em" viewBox="0 0 16 16">
                <Circle cx={8} cy={8} r={7} />
            </Svg>
        </Wrapper>
    )
}

