export type SeedSource = "daily-block" | "manual-hash" | "offline-day-count";

export type BlockchainSeedInfo = {
	hash: string;
	height?: number;
	timestamp?: number;
	dayStartTimestamp?: number;
	dayCount?: number;
	source: SeedSource;
};

export type CachedDailySeed = BlockchainSeedInfo & {
	dayStartTimestamp: number;
};
