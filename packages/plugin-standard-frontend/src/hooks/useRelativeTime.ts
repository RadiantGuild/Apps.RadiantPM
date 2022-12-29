import {useCallback, useEffect, useMemo, useState} from "react";
import modulo from "~/utils/modulo";

// Time difference to switch to showing the target time date, in ms (30 days).
const DATE_THRESHOLD = 2592000000;

// Update a bit later to account for inaccurate timers.
const UPDATE_OFFSET = 100;

// Enter the next unit a bit early or late.
const NEXT_UNIT_MULTIPLIER = 0.7;

// DateTimeFormat constructor isn't updated to use readonly string[]
const displayLocales =
    typeof window === "undefined" ? null : (navigator.languages as string[]);

const dateWithoutYearFormatter =
    displayLocales &&
    new Intl.DateTimeFormat(displayLocales, {
        day: "numeric",
        month: "short"
    });

const dateWithYearFormatter =
    displayLocales &&
    new Intl.DateTimeFormat(displayLocales, {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

const relativeFormatter =
    displayLocales &&
    new Intl.RelativeTimeFormat(displayLocales, {
        numeric: "auto",
        style: "long"
    });

// longest first
const units = {
    week: 1000 * 60 * 60 * 7,
    day: 1000 * 60 * 60 * 24,
    hour: 1000 * 60 * 60,
    minute: 1000 * 60,
    second: 1000
};

function roundAwayFromZero(value: number) {
    const sign = Math.sign(value);
    const abs = Math.abs(value);
    return Math.ceil(abs) * sign;
}

function findDurationUnit(absoluteDuration: number): keyof typeof units {
    for (const [unitName, unitMinimumDuration] of Object.entries(units)) {
        if (absoluteDuration < unitMinimumDuration * NEXT_UNIT_MULTIPLIER) continue;
        return unitName as keyof typeof units;
    }

    // will show “now”
    return "second";
}

interface RelativeTimeState {
    formattedRelativeTime: string;
    nextUpdateAt: number;
}

function getNextUpdateAt(time: Date, relativeTo: Date, durationUnitMs: number) {
    const timeMs = time.getTime();
    const relativeToMs = relativeTo.getTime();

    const offset = modulo(relativeToMs - timeMs, durationUnitMs);
    return relativeToMs + (durationUnitMs - offset) + UPDATE_OFFSET;
}

function getRelativeTime(
    time: Date,
    relativeTo: Date
): RelativeTimeState | null {
    if (
        !dateWithoutYearFormatter ||
        !dateWithYearFormatter ||
        !relativeFormatter
    ) {
        return null;
    }

    // positive when time is in the future, negative when it is in the past
    const elapsedTime = time.getTime() - relativeTo.getTime();
    const absoluteDuration = Math.abs(elapsedTime);

    if (absoluteDuration > DATE_THRESHOLD) {
        if (time.getFullYear() === relativeTo.getFullYear()) {
            return {
                formattedRelativeTime: dateWithoutYearFormatter.format(time),
                nextUpdateAt: getNextUpdateAt(time, relativeTo, units.day)
            };
        } else {
            return {
                formattedRelativeTime: dateWithYearFormatter.format(time),
                nextUpdateAt: getNextUpdateAt(time, relativeTo, units.day)
            };
        }
    }

    const durationUnit = findDurationUnit(absoluteDuration);
    const durationUnitMs = units[durationUnit];
    const elapsedTimeInUnit = roundAwayFromZero(elapsedTime / durationUnitMs);

    const formattedRelativeTime = relativeFormatter.format(
        elapsedTimeInUnit,
        durationUnit
    );

    return {
        formattedRelativeTime,
        nextUpdateAt: getNextUpdateAt(time, relativeTo, durationUnitMs)
    };
}

/**
 * Returns a relative time string based on `Intl.RelativeTimeFormat`.
 * If the output should be relative to the current time, use `useRelativeTime` instead as it can update smarter.
 *
 * @param time The target time.
 * For example, a `time` set two minutes after `relativeTo` would return `in 2 minutes`.
 * Should be a stable value to reduce renders.
 * @param relativeTo The base time the result is relative to.
 * Should be a stable value to reduce renders.
 */
export function useTimeRelativeTo(time: Date, relativeTo: Date): string | null {
    const [isAvailable, setAvailable] = useState(false);
    useEffect(() => setAvailable(true));

    return useMemo(() => {
        if (!isAvailable) return null;
        const result = getRelativeTime(time, relativeTo);
        return result ? result.formattedRelativeTime : null;
    }, [isAvailable, time, relativeTo]);
}

/**
 * Returns a relative time string, relative to the current time, based on `Intl.RelativeTimeFormat`.
 * Automatically handles updates based on the unit of time.
 *
 * @param time The target time.
 * For example, a `time` set two minutes after now would return `in 2 minutes`.
 * Should be a stable value to reduce renders.
 */
export default function useRelativeTime(time: Date): string | null {
    const [state, setState] = useState<RelativeTimeState | null>(null);

    const recalculate = useCallback(() => {
        const newState = getRelativeTime(time, new Date());
        setState(newState);
    }, [time]);

    useEffect(() => {
        if (!state) return;

        const timeoutDuration = state.nextUpdateAt - Date.now();

        // prevent infinite loops from errors
        if (timeoutDuration <= 0) return;

        const timeout = setTimeout(() => recalculate(), timeoutDuration);
        return () => clearTimeout(timeout);
    }, [state, recalculate]);

    useEffect(() => recalculate(), [recalculate]);

    return state ? state.formattedRelativeTime : null;
}
