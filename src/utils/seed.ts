import {
	DAILY_SEED_CACHE_KEY,
	MEMPOOL_API_BASE_URL,
} from "../constants/predefinedOptions";
import type { BlockchainSeedInfo, CachedDailySeed } from "../types/seed";

type MempoolTimestampLookup = {
	height: number;
	hash: string;
	timestamp: string;
};

type MempoolBlockResponse = {
	id: string;
	height: number;
	timestamp: number;
};

export const seededRandomFromHash = (hash: string): number => {
	const normalizedHash = hash.trim().toLowerCase();
	let accumulator = 2166136261;

	for (const character of normalizedHash) {
		accumulator ^= character.charCodeAt(0);
		accumulator = Math.imul(accumulator, 16777619);
	}

	return (accumulator >>> 0) / 4294967296;
};

export const getDaysSinceReferenceDate = (): number => {
	const referenceDate = new Date("1992-06-28T00:00:00Z");
	const millisecondsPerDay = 1000 * 60 * 60 * 24;
	return Math.floor(
		(Date.now() - referenceDate.getTime()) / millisecondsPerDay,
	);
};

export const seededRandomFromNumber = (seed: number): number => {
	const x = Math.sin(seed + 1) * 10000;
	return x - Math.floor(x);
};

export const getCurrentUtcDayStartTimestamp = (): number => {
	const now = new Date();
	return Math.floor(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000,
	);
};

export const formatUnixTimestampAsUtc = (timestamp: number): string =>
	new Date(timestamp * 1000).toLocaleString("de-DE", {
		timeZone: "UTC",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});

export const shortenHash = (
	hash: string,
	prefixLength = 12,
	suffixLength = 10,
): string => {
	if (hash.length <= prefixLength + suffixLength + 3) {
		return hash;
	}

	return `${hash.slice(0, prefixLength)}...${hash.slice(-suffixLength)}`;
};

const fetchJson = async <T>(url: string): Promise<T> => {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error("Blockchain-Daten konnten nicht geladen werden.");
	}

	return (await response.json()) as T;
};

const fetchText = async (url: string): Promise<string> => {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error("Blockchain-Daten konnten nicht geladen werden.");
	}

	return response.text();
};

export const readCachedDailySeed = (
	dayStartTimestamp: number,
): CachedDailySeed | null => {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		const rawValue = window.localStorage.getItem(DAILY_SEED_CACHE_KEY);

		if (!rawValue) {
			return null;
		}

		const parsed = JSON.parse(rawValue) as Partial<CachedDailySeed>;

		if (
			parsed.dayStartTimestamp !== dayStartTimestamp ||
			typeof parsed.hash !== "string" ||
			typeof parsed.height !== "number" ||
			typeof parsed.timestamp !== "number"
		) {
			return null;
		}

		return {
			hash: parsed.hash,
			height: parsed.height,
			timestamp: parsed.timestamp,
			dayStartTimestamp: parsed.dayStartTimestamp,
			source: "daily-block",
		};
	} catch {
		return null;
	}
};

export const cacheDailySeed = (seedInfo: CachedDailySeed): void => {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.localStorage.setItem(DAILY_SEED_CACHE_KEY, JSON.stringify(seedInfo));
	} catch {
		// Ignore cache write errors.
	}
};

export const createOfflineDayCountSeed = (): BlockchainSeedInfo => {
	const dayCount = getDaysSinceReferenceDate();

	return {
		hash: String(dayCount),
		dayCount,
		source: "offline-day-count",
	};
};

export const fetchFirstBlockOfCurrentUtcDay =
	async (): Promise<BlockchainSeedInfo> => {
		const dayStartTimestamp = getCurrentUtcDayStartTimestamp();
		const closestBlock = await fetchJson<MempoolTimestampLookup>(
			`${MEMPOOL_API_BASE_URL}/v1/mining/blocks/timestamp/${dayStartTimestamp}`,
		);

		let targetHeight = closestBlock.height;
		let targetHash = closestBlock.hash;
		const closestTimestamp = Math.floor(
			new Date(closestBlock.timestamp).getTime() / 1000,
		);

		if (closestTimestamp < dayStartTimestamp) {
			const tipHeight = Number(
				await fetchText(`${MEMPOOL_API_BASE_URL}/blocks/tip/height`),
			);

			targetHeight += 1;

			if (targetHeight > tipHeight) {
				throw new Error(
					"Der erste Bitcoin-Block des heutigen UTC-Tages existiert noch nicht.",
				);
			}

			targetHash = await fetchText(
				`${MEMPOOL_API_BASE_URL}/block-height/${targetHeight}`,
			);
		}

		const block = await fetchJson<MempoolBlockResponse>(
			`${MEMPOOL_API_BASE_URL}/block/${targetHash.trim()}`,
		);

		if (block.timestamp < dayStartTimestamp) {
			throw new Error(
				"Der erste Bitcoin-Block des heutigen UTC-Tages existiert noch nicht.",
			);
		}

		return {
			hash: block.id,
			height: block.height,
			timestamp: block.timestamp,
			dayStartTimestamp,
			source: "daily-block",
		};
	};
