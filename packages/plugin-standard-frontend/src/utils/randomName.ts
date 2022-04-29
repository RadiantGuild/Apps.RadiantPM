const verbs = [
    "would",
    "make",
    "know",
    "will",
    "think",
    "take",
    "come",
    "could",
    "want",
    "look",
    "find",
    "give",
    "tell",
    "work",
    "should",
    "call",
    "need",
    "feel",
    "become",
    "leave",
    "mean",
    "keep",
    "begin",
    "seem",
    "help",
    "talk",
    "turn",
    "start",
    "might",
    "show",
    "hear",
    "play",
    "move",
    "like",
    "live",
    "believe",
    "hold",
    "bring",
    "happen",
    "must",
    "write",
    "provide",
    "stand",
    "lose",
    "meet",
    "include",
    "continue",
    "learn",
    "change",
    "lead",
    "understand",
    "watch",
    "follow",
    "stop",
    "create",
    "speak",
    "read",
    "allow",
    "spend",
    "grow",
    "open",
    "walk",
    "offer",
    "remember",
    "love",
    "consider",
    "appear",
    "wait",
    "serve",
    "send",
    "expect",
    "build",
    "stay",
    "fall",
    "reach",
    "remain"
];

const nouns = [
    "time",
    "year",
    "people",
    "way",
    "day",
    "man",
    "thing",
    "woman",
    "life",
    "child",
    "world",
    "school",
    "state",
    "family",
    "student",
    "group",
    "country",
    "problem",
    "hand",
    "part",
    "place",
    "case",
    "week",
    "company",
    "system",
    "program",
    "question",
    "work",
    "government",
    "number",
    "night",
    "point",
    "home",
    "water",
    "room",
    "mother",
    "area",
    "money",
    "story",
    "fact",
    "month",
    "lot",
    "right",
    "study",
    "book",
    "eye",
    "job",
    "word",
    "business",
    "issue",
    "side",
    "kind",
    "head",
    "house",
    "service",
    "friend",
    "father",
    "power",
    "hour",
    "game",
    "line",
    "end",
    "member",
    "law",
    "car",
    "city",
    "community",
    "name",
    "president",
    "team",
    "minute",
    "idea",
    "kid",
    "body",
    "information",
    "back",
    "parent",
    "face",
    "others",
    "level",
    "office",
    "door",
    "health",
    "person",
    "art",
    "war",
    "history",
    "party",
    "result",
    "change",
    "morning",
    "reason",
    "research",
    "girl",
    "guy",
    "moment",
    "air",
    "teacher",
    "force",
    "education"
];

export default function randomName(): string {
    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    const verbUpper = verb[0].toUpperCase() + verb.substring(1);
    const nounUpper = noun[0].toUpperCase() + noun.substring(1);

    return `${verbUpper} ${nounUpper}`;
}
