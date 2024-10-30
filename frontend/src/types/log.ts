export type Event = {
    timestamp: number;
    category: string;
    type: string;
    value: string;
};

export type Result = {
    answer: {
        mediaItemName: string;
    };
    rank: number;
};