import camelToDash from "~/utils/camelToDash";

type Transition = string | Record<string, string>;

const transition = {
    timing: {
        easeIn: "cubic-bezier(0.4, 0, 1, 1)",
        easeOut: "cubic-bezier(0, 0, 0.2, 1)",
        easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)"
    },
    duration: {
        ultrafast: "50ms",
        faster: "100ms",
        fast: "150ms",
        normal: "200ms",
        slow: "300ms",
        slower: "400ms",
        ultraslow: "500ms"
    },
    properties: {
        common: "background-color, border-color, color, fill, stroke, opacity, box-shadow, transform",
        colors: "background-color, border-color, color, fill, stroke",
        dimensions: "width, height",
        position: "left, right, top, bottom",
        background: "background-color, background-image, background-position"
    }
};

type TransitionObj = typeof transition;
type TimingKeys = keyof TransitionObj["timing"];
type DurationKeys = keyof TransitionObj["duration"];
type PropertyKeys = keyof TransitionObj["properties"];

function buildTransition(src: Transition, properties?: string): string {
    if (typeof src === "object") {
        return Object.entries(src)
            .map(([k, v]) => buildTransition(v, k))
            .join(", ");
    }

    const [timing, duration = "normal"] = src.split(" ");

    const propertiesValue = properties
        ? properties in transition.properties
            ? transition.properties[properties as PropertyKeys]
            : camelToDash(properties)
        : "";
    const timingValue =
        timing in transition.timing
            ? transition.timing[timing as TimingKeys]
            : timing;
    const durationValue =
        duration in transition.duration
            ? transition.duration[duration as DurationKeys]
            : duration;

    return propertiesValue
        .split(",")
        .map(prop =>
            [prop.trim(), timingValue.trim(), durationValue.trim()].join(" ")
        )
        .join(", ");
}

export const trans = {
    /**
     * Object form of the CSS `transition` property, with some pre-defined values
     *
     * The passed value should be an array of, or just one of either a transition
     * string with a $ prefix (more on that soon), or an object whose keys are
     * property names (one of the pre-defined properties, or CSS properties split
     * by commas) and whose value is a transition string.
     *
     * Transition strings are in the format "[timing] [duration=normal]". Timing
     * is either one of the built-in easing functions or a CSS easing function.
     * Duration is either a built-in duration name or a CSS duration.
     *
     * ## Property aliases
     * - common: background-color, border-color, color, fill, stroke, opacity,
     *     box-shadow, transform
     * - colors: background-color, border-color, color, fill, stroke
     * - dimensions: width, height
     * - position: left, right, top, bottom
     * - background: background-color, background-image, background-position
     *
     * ## Timing functions
     * - easeIn: slow start, fast end (something moving out of screen)
     * - easeOut: fast start, slow end (something moving into screen, or user
     *     actions)
     * - easeInOut: slow start, slow end (something moving across the screen)
     *
     *## Duration aliases
     * - ultrafast: 50ms
     * - faster: 100ms
     * - fast: 150ms
     * - normal: 200ms
     * - slow: 300ms
     * - slower: 400ms
     * - ultraslow: 500ms
     */
    trans: (value: Transition | Transition[]) => {
        if (Array.isArray(value)) {
            return {
                transition: value.map(item => buildTransition(item)).join(", ")
            };
        }

        if (typeof value === "object") {
            return {transition: buildTransition(value)};
        }

        if (!value.startsWith("$")) return {transition: value};
        return {transition: buildTransition(value.substring(1))};
    }
};
