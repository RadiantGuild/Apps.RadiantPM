import type {Feed, SimplePackage} from "@radiantpm/plugin-utils";
import {ReactElement} from "react";

export interface FeedPageProps {
    feed: Feed;
    packages: readonly SimplePackage[];
}

export function Page({feed, packages}: FeedPageProps): ReactElement {
    return (
        <>
            <h1>{feed.name}</h1>

            <ul>
                {packages.map(pkg => (
                    <li key={pkg.slug}>
                        {pkg.name} ({pkg.latestVersion})
                    </li>
                ))}
            </ul>
        </>
    )
}
