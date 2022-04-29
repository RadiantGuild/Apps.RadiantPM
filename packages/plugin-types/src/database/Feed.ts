interface BaseFeed {
    /**
     * A short name for this feed using only simple URL-friendly characters
     */
    slug: string;

    /**
     * The display name of this feed
     */
    name: string;
}

export interface SimpleFeed extends BaseFeed {
    packagesCount: number;
}

export type Feed = BaseFeed;
