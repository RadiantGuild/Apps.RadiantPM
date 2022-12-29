import {ReactElement, useEffect, useMemo, useState} from "react";
import useRelativeTime from "~/hooks/useRelativeTime";

const humanTitleFormatter =
    typeof window === "undefined"
        ? null
        : new Intl.DateTimeFormat(navigator.languages as string[], {
              day: "numeric",
              month: "2-digit",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
          });

export interface RelativeTimeProps {
    time: Date;
    placeholder?: string;
    className?: string;
}

export function RelativeTime({
    time,
    placeholder = "sometime",
    className
}: RelativeTimeProps): ReactElement {
    const display = useRelativeTime(time);

    const [humanTitleVisible, setHumanTitleVisible] = useState(false);

    const humanTitle = useMemo(
        () =>
            humanTitleVisible ? humanTitleFormatter?.format(time) : undefined,
        [humanTitleVisible, time]
    );

    useEffect(() => setHumanTitleVisible(true));

    return (
        <time
            className={className}
            dateTime={time.toISOString()}
            title={humanTitle}
        >
            {display ?? placeholder}
        </time>
    );
}
