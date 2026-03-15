import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Wheel } from "react-custom-roulette";
import Confetti from "react-confetti";
import {
	Button,
	TextField,
	Container,
	Box,
	Typography,
	List,
	ListItem,
	IconButton,
	Modal,
	Link,
	Checkbox,
	FormControlLabel,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Tooltip,
	Stack,
} from "@mui/material";
import {
	Delete,
	GitHub,
	ExpandMore,
	InfoOutlined,
	ContentCopy,
	Share,
} from "@mui/icons-material";
import { useWindowSize } from "@react-hook/window-size";
import { Card, CardHeader, CardContent } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";

// Funktion zur Generierung von kontrastreichen Farben
const generateContrastingColors = (count: number): string[] => {
	const colors: string[] = [];
	for (let i = 0; i < count; i++) {
		const hue = (i * (360 / count)) % 360;
		colors.push(`hsl(${hue}, 80%, 50%)`);
	}
	return colors;
};

// Vordefinierte Optionen
const predefinedOptions = [
	"Pascal",
	"Corinna",
	"Jan",
	"Ja",
	"Nein",
	"Kerstin",
	"Flo",
	"Miri",
	"Robin",
	"Franzi",
	"Alex",
	"Jonas",
	"Max",
	"Quirin",
	"Angy",
	"Tom",
].sort((a, b) => a.localeCompare(b));

const MEMPOOL_API_BASE_URL = "https://mempool.space/api";

type BlockchainSeedInfo = {
	hash: string;
	height?: number;
	timestamp?: number;
	dayStartTimestamp?: number;
	dayCount?: number;
	source: "daily-block" | "manual-hash" | "offline-day-count";
};

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

type CachedDailySeed = BlockchainSeedInfo & {
	dayStartTimestamp: number;
};

const DAILY_SEED_CACHE_KEY = "gluecksrad-daily-seed-cache";

const seededRandomFromHash = (hash: string): number => {
	const normalizedHash = hash.trim().toLowerCase();
	let accumulator = 2166136261;

	for (const character of normalizedHash) {
		accumulator ^= character.charCodeAt(0);
		accumulator = Math.imul(accumulator, 16777619);
	}

	return (accumulator >>> 0) / 4294967296;
};

const getDaysSinceReferenceDate = (): number => {
	const referenceDate = new Date("1992-06-28T00:00:00Z");
	const millisecondsPerDay = 1000 * 60 * 60 * 24;
	return Math.floor(
		(Date.now() - referenceDate.getTime()) / millisecondsPerDay,
	);
};

const seededRandomFromNumber = (seed: number): number => {
	const x = Math.sin(seed + 1) * 10000;
	return x - Math.floor(x);
};

const getCurrentUtcDayStartTimestamp = (): number => {
	const now = new Date();
	return Math.floor(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000,
	);
};

const formatUnixTimestampAsUtc = (timestamp: number): string =>
	new Date(timestamp * 1000).toLocaleString("de-DE", {
		timeZone: "UTC",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});

const shortenHash = (
	hash: string,
	prefixLength = 12,
	suffixLength = 10,
): string => {
	if (hash.length <= prefixLength + suffixLength + 3) {
		return hash;
	}

	return `${hash.slice(0, prefixLength)}...${hash.slice(-suffixLength)}`;
};

const fetchJson = async <T,>(url: string): Promise<T> => {
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

const readCachedDailySeed = (
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

const cacheDailySeed = (seedInfo: CachedDailySeed): void => {
	if (typeof window === "undefined") {
		return;
	}

	try {
		window.localStorage.setItem(DAILY_SEED_CACHE_KEY, JSON.stringify(seedInfo));
	} catch {
		// Ignore cache write errors.
	}
};

const createOfflineDayCountSeed = (): BlockchainSeedInfo => {
	const dayCount = getDaysSinceReferenceDate();

	return {
		hash: String(dayCount),
		dayCount,
		source: "offline-day-count",
	};
};

const fetchFirstBlockOfCurrentUtcDay =
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

const sanitizeFilenamePart = (value: string): string =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9äöüß]+/gi, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 50);

const createTimestamp = (): string => {
	const now = new Date();
	const pad = (value: number): string => String(value).padStart(2, "0");

	return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

export default function App() {
	const [items, setItems] = useState<string[]>([]);
	const [newItem, setNewItem] = useState("");
	const [drawingTopic, setDrawingTopic] = useState("");
	const [winner, setWinner] = useState<string | null>(null);
	const [mustSpin, setMustSpin] = useState(false);
	const [prizeNumber, setPrizeNumber] = useState(0);
	const [openModal, setOpenModal] = useState(false);
	const [selectedPredefined, setSelectedPredefined] = useState<string[]>([]);
	const [width, height] = useWindowSize();
	const [teamCount, setTeamCount] = useState(2);
	const [teams, setTeams] = useState<string[][]>([]);
	const [wheelMode, setWheelMode] = useState<"single" | "teams">("single");
	const [useSeed, setUseSeed] = useState(true);
	const [openSeedInfo, setOpenSeedInfo] = useState(false);
	const [currentSeedInfo, setCurrentSeedInfo] =
		useState<BlockchainSeedInfo | null>(null);
	const [usedSeedInfo, setUsedSeedInfo] = useState<BlockchainSeedInfo | null>(
		null,
	);
	const [isLoadingSeed, setIsLoadingSeed] = useState(false);
	const [spinHint, setSpinHint] = useState<string | null>(null);
	const [isSharing, setIsSharing] = useState(false);
	const [shareHint, setShareHint] = useState<string | null>(null);
	const [verificationHash, setVerificationHash] = useState("");
	const [verificationHint, setVerificationHint] = useState<string | null>(null);
	const [seedCopyHint, setSeedCopyHint] = useState<string | null>(null);
	const [isUsingOfflineSeedFallback, setIsUsingOfflineSeedFallback] =
		useState(false);
	const shareCardRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!useSeed) {
			setCurrentSeedInfo(null);
			setIsUsingOfflineSeedFallback(false);
			return;
		}

		let isCancelled = false;
		const dayStartTimestamp = getCurrentUtcDayStartTimestamp();
		const cachedSeed = readCachedDailySeed(dayStartTimestamp);

		if (cachedSeed) {
			setCurrentSeedInfo(cachedSeed);
			setIsUsingOfflineSeedFallback(true);
			setVerificationHash((currentHash) =>
				currentHash.trim() === "" ? cachedSeed.hash : currentHash,
			);
		} else {
			setIsUsingOfflineSeedFallback(false);
		}

		const loadCurrentSeed = async () => {
			try {
				const blockchainSeed = await fetchFirstBlockOfCurrentUtcDay();

				if (isCancelled) return;

				cacheDailySeed({
					hash: blockchainSeed.hash,
					height: blockchainSeed.height ?? 0,
					timestamp: blockchainSeed.timestamp ?? 0,
					dayStartTimestamp,
					source: "daily-block",
				});
				setCurrentSeedInfo(blockchainSeed);
				setIsUsingOfflineSeedFallback(false);
				setVerificationHash((currentHash) =>
					currentHash.trim() === "" ? blockchainSeed.hash : currentHash,
				);
			} catch {
				if (isCancelled) return;

				const fallbackSeed = cachedSeed ?? createOfflineDayCountSeed();
				setCurrentSeedInfo(fallbackSeed);
				setIsUsingOfflineSeedFallback(true);
			}
		};

		void loadCurrentSeed();

		return () => {
			isCancelled = true;
		};
	}, [useSeed]);

	const handleAddItem = () => {
		if (newItem.trim() !== "") {
			setItems([...items, newItem.trim()]);
			setNewItem("");
		}
	};

	const handleRemoveItem = (index: number) => {
		setItems(items.filter((_, i) => i !== index));
	};

	const handlePredefinedSelection = (option: string, checked: boolean) => {
		if (checked) {
			setSelectedPredefined([...selectedPredefined, option]);
		} else {
			setSelectedPredefined(
				selectedPredefined.filter((item) => item !== option),
			);
		}
	};

	const handleApplySelectedOptions = () => {
		// Füge die ausgewählten vordefinierten Optionen zu den Items hinzu
		const newItems = [...items];
		selectedPredefined.forEach((option) => {
			if (!newItems.includes(option)) {
				newItems.push(option);
			}
		});
		setItems(newItems);
		setSelectedPredefined([]); // Reset der Auswahl
	};

	const handleSpin = async () => {
		setWheelMode("single");
		if (allOptions.length === 0 || isLoadingSeed) return;
		setShareHint(null);
		setSpinHint(null);

		try {
			let randomValue = Math.random();

			if (useSeed) {
				setIsLoadingSeed(true);
				const dayStartTimestamp = getCurrentUtcDayStartTimestamp();
				const cachedSeed = readCachedDailySeed(dayStartTimestamp);
				const hasCurrentDailySeed =
					(currentSeedInfo?.source === "daily-block" ||
						currentSeedInfo?.source === "offline-day-count") &&
					currentSeedInfo.dayStartTimestamp === dayStartTimestamp;
				const blockchainSeed = hasCurrentDailySeed
					? currentSeedInfo
					: (cachedSeed ??
						(await fetchFirstBlockOfCurrentUtcDay().catch(() =>
							createOfflineDayCountSeed(),
						)));
				randomValue =
					blockchainSeed.source === "offline-day-count" &&
					blockchainSeed.dayCount !== undefined
						? seededRandomFromNumber(blockchainSeed.dayCount)
						: seededRandomFromHash(blockchainSeed.hash);
				if (!hasCurrentDailySeed && !cachedSeed) {
					if (blockchainSeed.source === "daily-block") {
						cacheDailySeed({
							hash: blockchainSeed.hash,
							height: blockchainSeed.height ?? 0,
							timestamp: blockchainSeed.timestamp ?? 0,
							dayStartTimestamp,
							source: "daily-block",
						});
					}
				}
				if (
					blockchainSeed.source === "offline-day-count" &&
					blockchainSeed.dayStartTimestamp === undefined
				) {
					blockchainSeed.dayStartTimestamp = dayStartTimestamp;
				}
				setCurrentSeedInfo(blockchainSeed);
				setIsUsingOfflineSeedFallback(
					blockchainSeed.source !== "daily-block" ||
						(cachedSeed !== null && !hasCurrentDailySeed),
				);
				setUsedSeedInfo(blockchainSeed);
				if (blockchainSeed.source === "daily-block") {
					setVerificationHash(blockchainSeed.hash);
				}
			} else {
				setUsedSeedInfo(null);
			}

			const randomIndex = Math.floor(randomValue * allOptions.length);
			setPrizeNumber(randomIndex);
			setMustSpin(true);
		} catch {
			setSpinHint(
				"Der Tages-Blockchain-Seed konnte gerade nicht geladen werden. Es wird stattdessen die Tagesanzahl seit dem 28.06.1992 verwendet.",
			);
		} finally {
			setIsLoadingSeed(false);
		}
	};

	const handleCloseModal = () => {
		setOpenModal(false);
		setWinner(null);
		setShareHint(null);
	};

	const handleCloseSeedInfo = () => {
		setOpenSeedInfo(false);
	};

	const handleCopySeedHash = async (hash: string) => {
		try {
			await navigator.clipboard.writeText(hash);
			setSeedCopyHint("Vollständiger Hash kopiert.");
		} catch {
			setSeedCopyHint(
				"Hash konnte nicht in die Zwischenablage kopiert werden.",
			);
		}
	};

	const handleVerifyWithHash = () => {
		setWheelMode("single");
		setShareHint(null);
		setSpinHint(null);
		setVerificationHint(null);

		if (allOptions.length === 0) {
			setVerificationHint(
				"Zum Verifizieren müssen zuerst dieselben Optionen wie bei der ursprünglichen Auslosung eingetragen sein.",
			);
			return;
		}

		const normalizedVerificationValue = verificationHash.trim().toLowerCase();

		if (/^\d+$/.test(normalizedVerificationValue)) {
			const dayCount = Number(normalizedVerificationValue);

			if (!Number.isSafeInteger(dayCount)) {
				setVerificationHint(
					"Bitte einen gültigen Fallback-Seed als ganze Zahl eingeben.",
				);
				return;
			}

			const randomValue = seededRandomFromNumber(dayCount);
			const randomIndex = Math.floor(randomValue * allOptions.length);

			setUsedSeedInfo({
				hash: String(dayCount),
				dayCount,
				source: "offline-day-count",
			});
			setPrizeNumber(randomIndex);
			setMustSpin(true);
			return;
		}

		if (!/^[0-9a-f]{64}$/.test(normalizedVerificationValue)) {
			setVerificationHint(
				"Bitte einen gültigen Bitcoin-Block-Hash mit 64 Hex-Zeichen oder den Offline-Fallback-Seed als ganze Zahl eingeben.",
			);
			return;
		}

		const randomValue = seededRandomFromHash(normalizedVerificationValue);
		const randomIndex = Math.floor(randomValue * allOptions.length);

		setUsedSeedInfo({
			hash: normalizedVerificationValue,
			source: "manual-hash",
		});
		setPrizeNumber(randomIndex);
		setMustSpin(true);
	};

	const downloadImage = (imageBlob: Blob, fileName: string) => {
		const downloadUrl = URL.createObjectURL(imageBlob);
		const link = document.createElement("a");
		link.href = downloadUrl;
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(downloadUrl);
	};

	const handleShareResult = async () => {
		if (!winner || !shareCardRef.current) return;

		setIsSharing(true);
		setShareHint(null);

		try {
			const canvas = await html2canvas(shareCardRef.current, {
				backgroundColor: "#ffffff",
				scale: 2,
				useCORS: true,
			});

			const imageBlob = await new Promise<Blob | null>((resolve) => {
				canvas.toBlob(resolve, "image/png");
			});

			if (!imageBlob) {
				throw new Error("Screenshot konnte nicht erstellt werden.");
			}

			const topicPart = sanitizeFilenamePart(drawingTopic);
			const fileName = `${createTimestamp()}${topicPart ? `-${topicPart}` : ""}.png`;

			const imageFile = new File([imageBlob], fileName, {
				type: "image/png",
			});

			const shareData: ShareData = {
				files: [imageFile],
			};

			if (navigator.canShare?.({ files: [imageFile] })) {
				await navigator.share(shareData);
				return;
			}

			setShareHint(
				"Direktes Bild-Teilen wird auf diesem Gerät oder in diesem Browser nicht unterstützt. Der Screenshot wurde stattdessen heruntergeladen.",
			);
			downloadImage(imageBlob, fileName);
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				return;
			}

			setShareHint("Teilen ist auf diesem Gerät gerade nicht verfügbar.");
		} finally {
			setIsSharing(false);
		}
	};

	const handleTeamSelection = (numTeams: number) => {
		setWheelMode("teams");
		setSpinHint(null);
		// clear teams
		setTeams([]);

		// start animation
		setMustSpin(true);

		if (allOptions.length < 2 || numTeams < 2 || numTeams > allOptions.length)
			return;

		// Shuffle options
		const shuffled = [...allOptions].sort(() => 0.5 - Math.random());

		// Calculate base size and remainder
		const baseSize = Math.floor(shuffled.length / numTeams);
		const remainder = shuffled.length % numTeams;

		const sizes = Array(numTeams).fill(baseSize);

		for (let i = 0; i < remainder; i++) {
			sizes[i] += 1;
		}

		const newTeams: string[][] = [];
		let start = 0;
		for (let i = 0; i < numTeams; i++) {
			const end = start + sizes[i];
			newTeams.push(shuffled.slice(start, end));
			start = end;
		}

		setTeams(newTeams);
	};

	// Kombiniere alle Optionen (benutzerdefinierte + ausgewählte vordefinierte)
	const allOptions = [...items];

	const colors = generateContrastingColors(allOptions.length);
	const wheelData =
		allOptions.length > 0
			? allOptions.map((item, index) => ({
					option: item,
					style: { backgroundColor: colors[index] },
				}))
			: [
					{
						option: "",
						style: { backgroundColor: "#42f5cb" },
					},
				];

	const confettiWidth =
		typeof document !== "undefined"
			? Math.max(
					width,
					document.documentElement.scrollWidth,
					document.body?.scrollWidth ?? 0,
				)
			: width;
	const confettiHeight =
		typeof document !== "undefined"
			? Math.max(
					height,
					document.documentElement.scrollHeight,
					document.body?.scrollHeight ?? 0,
				)
			: height;

	return (
		<Container
			sx={{
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				textAlign: "center",
				width: "100vw",
				maxWidth: "100vw",
				overflowX: "hidden",
			}}
		>
			<Typography variant="h2" sx={{ m: 5 }} gutterBottom>
				Glücksrad
			</Typography>
			<Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
				<TextField
					label="Thema der Auslosung (optional)"
					variant="outlined"
					value={drawingTopic}
					onChange={(e) => setDrawingTopic(e.target.value)}
					sx={{ width: { xs: "100%", sm: 420 } }}
				/>
			</Box>
			<Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 3 }}>
				<TextField
					label="Neue Option"
					variant="outlined"
					value={newItem}
					onChange={(e) => setNewItem(e.target.value)}
				/>
				<Button variant="contained" onClick={handleAddItem}>
					Hinzufügen
				</Button>
			</Box>

			{/* Accordion für vordefinierte Optionen */}
			<Accordion sx={{ mb: 3 }}>
				<AccordionSummary expandIcon={<ExpandMore />}>
					<Typography variant="h6">
						Aus vordefinierten Optionen wählen
					</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
								gap: 1,
								mb: 2,
							}}
						>
							{predefinedOptions.map((option) => (
								<FormControlLabel
									key={option}
									control={
										<Checkbox
											checked={selectedPredefined.includes(option)}
											onChange={(e) =>
												handlePredefinedSelection(option, e.target.checked)
											}
											disabled={items.includes(option)}
										/>
									}
									label={option}
								/>
							))}
						</Box>
						<Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
							<Button
								variant="contained"
								onClick={handleApplySelectedOptions}
								disabled={selectedPredefined.length === 0}
							>
								Ausgewählte Optionen hinzufügen ({selectedPredefined.length})
							</Button>
							<Button
								variant="outlined"
								onClick={() => setSelectedPredefined([])}
								disabled={selectedPredefined.length === 0}
							>
								Auswahl zurücksetzen
							</Button>
						</Box>
					</Box>
				</AccordionDetails>
			</Accordion>
			<List>
				{items.map((item, index) => (
					<ListItem
						sx={{
							border: 1,
							borderRadius: "5px",
							borderColor: "lightgray",
							marginBottom: 1,
						}}
						key={index}
						secondaryAction={
							<IconButton edge="end" onClick={() => handleRemoveItem(index)}>
								<Delete />
							</IconButton>
						}
					>
						{item}
					</ListItem>
				))}
			</List>
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					mt: 3,
				}}
			>
				<Wheel
					mustStartSpinning={mustSpin}
					prizeNumber={prizeNumber}
					data={wheelData}
					onStopSpinning={() => {
						setMustSpin(false);
						setWinner(
							allOptions.length > 0 && wheelMode !== "teams"
								? allOptions[prizeNumber]
								: null,
						);
						setOpenModal(true);
					}}
					spinDuration={0.5}
				/>
			</Box>

			{!mustSpin && wheelMode === "teams" && (
				<Box
					sx={{
						display: "flex",
						flexWrap: "wrap",
						justifyContent: "center",
						mt: 3,
					}}
				>
					{teams.map((team, idx) => {
						const teamColors = generateContrastingColors(teams.length);
						return (
							<Card
								key={idx}
								sx={{
									width: 220,
									m: 2,
									background: teamColors[idx],
									color: "#000000ff",
								}}
							>
								<CardHeader title={`Team ${idx + 1}`} />
								<CardContent>
									{team.map((member, mIdx) => (
										<Typography key={mIdx} variant="body1">
											{member}
										</Typography>
									))}
									<br></br>

									<GroupIcon htmlColor="#000" />
								</CardContent>
							</Card>
						);
					})}
				</Box>
			)}

			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					flexDirection: "column",
					gap: 2,
					mt: 3,
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						flexWrap: "wrap",
						gap: 2,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
						<FormControlLabel
							sx={{ mr: 0 }}
							control={
								<Checkbox
									checked={useSeed}
									onChange={(e) => setUseSeed(e.target.checked)}
								/>
							}
							label="Blockchain-Seed verwenden"
						/>
						<Tooltip title="Info zum Seed">
							<IconButton
								sx={{ ml: -0.5 }}
								aria-label="Seed-Informationen anzeigen"
								onClick={() => setOpenSeedInfo(true)}
							>
								<InfoOutlined />
							</IconButton>
						</Tooltip>
					</Box>
				</Box>
				{useSeed && (
					<Box sx={{ width: { xs: "100%", sm: 420, md: 520 } }}>
						<Typography variant="body2" sx={{ mb: 0.75, textAlign: "left" }}>
							Seed-Wert
						</Typography>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								gap: 1,
								border: "1px solid",
								borderColor: "divider",
								borderRadius: 1.5,
								px: 1.5,
								py: 1.25,
								bgcolor: "background.paper",
							}}
						>
							<Tooltip
								title={
									currentSeedInfo?.hash ??
									"Hash des aktuellen Tages wird geladen ..."
								}
							>
								<Typography
									variant="body2"
									sx={{
										fontFamily: "monospace",
										textAlign: "left",
										wordBreak: "break-all",
										flex: 1,
									}}
								>
									{currentSeedInfo?.hash
										? shortenHash(currentSeedInfo.hash)
										: "Hash des aktuellen Tages wird geladen ..."}
								</Typography>
							</Tooltip>
							<Tooltip title="Vollständigen Hash kopieren">
								<span>
									<IconButton
										size="small"
										onClick={() =>
											currentSeedInfo?.hash &&
											handleCopySeedHash(currentSeedInfo.hash)
										}
										disabled={!currentSeedInfo?.hash}
									>
										<ContentCopy fontSize="small" />
									</IconButton>
								</span>
							</Tooltip>
						</Box>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ display: "block", mt: 0.75, textAlign: "left" }}
						>
							{currentSeedInfo?.source === "daily-block" &&
							currentSeedInfo.height !== undefined &&
							currentSeedInfo.timestamp !== undefined
								? `${isUsingOfflineSeedFallback ? "Offline-Fallback aktiv: " : ""}Tages-Seed aus Bitcoin-Block #${currentSeedInfo.height} vom ${formatUnixTimestampAsUtc(currentSeedInfo.timestamp)} UTC`
								: currentSeedInfo?.source === "offline-day-count" &&
									  currentSeedInfo.dayCount !== undefined
									? `Offline-Fallback aktiv: Seed = ${currentSeedInfo.dayCount} Tage seit dem 28.06.1992`
									: "Der Seed wird automatisch geladen, kann nicht manuell geändert werden und basiert auf dem ersten Bitcoin-Block des aktuellen UTC-Tages."}
						</Typography>
						{seedCopyHint && (
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ display: "block", mt: 0.5, textAlign: "left" }}
							>
								{seedCopyHint}
							</Typography>
						)}
					</Box>
				)}
				<Button
					variant="contained"
					onClick={handleSpin}
					disabled={allOptions.length === 0 || isLoadingSeed}
					size="large"
					sx={{
						width: { xs: "100%", sm: 320, md: 360 },
						maxWidth: "100%",
						py: 1.5,
						fontSize: "1.05rem",
						fontWeight: 700,
						boxShadow: 4,
					}}
				>
					{isLoadingSeed ? "Blockchain wird geladen..." : "Drehen"}
				</Button>
			</Box>
			<Accordion style={{ marginTop: "20px" }}>
				<AccordionSummary expandIcon={<ExpandMore />}>
					<Typography>Ergebnis mit Hash verifizieren</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 2,
						}}
					>
						<TextField
							label="Hash oder Fallback-Seed zur Verifizierung"
							value={verificationHash}
							onChange={(e) => setVerificationHash(e.target.value)}
							placeholder="Hash oder Offline-Fallback aus dem geteilten Ergebnis einfügen"
							fullWidth
							multiline
							minRows={2}
							helperText="Mit demselben Bitcoin-Hash oder Offline-Fallback-Seed und denselben Optionen lässt sich das Ergebnis jederzeit reproduzieren."
							sx={{ width: "100%" }}
						/>
						<Button
							variant="outlined"
							onClick={handleVerifyWithHash}
							disabled={mustSpin || verificationHash.trim() === ""}
						>
							Mit Hash verifizieren
						</Button>
						{verificationHint && (
							<Typography variant="body2" color="error">
								{verificationHint}
							</Typography>
						)}
					</Box>
				</AccordionDetails>
			</Accordion>
			{spinHint && (
				<Typography
					variant="body2"
					color="error"
					sx={{ mt: 2, textAlign: "center" }}
				>
					{spinHint}
				</Typography>
			)}

			<Modal open={openSeedInfo} onClose={handleCloseSeedInfo}>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: { xs: "90%", sm: 480 },
						bgcolor: "background.paper",
						boxShadow: 24,
						borderRadius: 3,
						p: 4,
						textAlign: "left",
					}}
				>
					<Typography variant="h6" sx={{ mb: 2 }}>
						Was macht der Seed?
					</Typography>
					<Typography variant="body1" sx={{ mb: 2 }}>
						Wenn der Blockchain-Seed aktiviert ist, wird der erste Bitcoin-Block
						des aktuellen UTC-Tages verwendet. Dessen Hash bestimmt das Ergebnis
						reproduzierbar für den ganzen Tag.
					</Typography>
					<Typography variant="body1" sx={{ mb: 2 }}>
						Der Vorteil: Für kommende Tage ist das Ergebnis nicht vorhersagbar,
						weil der erste Block des jeweiligen Tages vorher noch nicht bekannt
						ist. Sobald dieser Block existiert, ist das Ergebnis aber für den
						gesamten Tag stabil und transparent nachvollziehbar.
					</Typography>
					<Typography variant="body1" sx={{ mb: 3 }}>
						Ist die Checkbox deaktiviert, wird bei jeder Drehung ein neuer
						echter Zufallswert verwendet. Dann ist die Drehung nicht an einen
						Blockchain-Hash gebunden und kann bei jedem Klick anders ausgehen.
						Für den Blockchain-Seed ist eine Internetverbindung nötig. Vor dem
						ersten Bitcoin-Block des UTC-Tages ist noch kein Tages-Seed
						verfügbar. Falls offline weder ein aktueller Block noch ein
						Cache-Wert verfügbar ist, wird als Fallback die Tagesanzahl seit dem
						28.06.1992 verwendet. Mit der Verifizierungsfunktion kann ein
						bereits bekannter Hash oder dieser Fallback-Wert später erneut
						eingesetzt werden, um dasselbe Ergebnis nachzurechnen.
					</Typography>
					<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
						<Button variant="contained" onClick={handleCloseSeedInfo}>
							Verstanden
						</Button>
					</Box>
				</Box>
			</Modal>

			<Accordion style={{ marginTop: "20px" }}>
				<AccordionSummary expandIcon={<ExpandMore />}>
					<Typography>Team Modus</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Box
						sx={{
							mt: 3,
							mb: 2,
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							gap: 2,
						}}
					>
						<TextField
							label="Anzahl Teams"
							type="number"
							variant="outlined"
							size="small"
							inputProps={{
								min: 2,
								step: 1,
							}}
							value={teamCount}
							onChange={(e) => {
								const value = Number(e.target.value);
								setTeamCount(value >= 2 ? value : 2);
							}}
							sx={{ width: 120 }}
						/>
					</Box>

					<Button
						variant="contained"
						sx={{ mt: 3 }}
						onClick={() => handleTeamSelection(teamCount)}
						disabled={teamCount < 2 || teamCount * 2 - 1 > allOptions.length}
					>
						{teamCount} Glücksrad Teams generieren
					</Button>
				</AccordionDetails>
			</Accordion>

			{/* Konfetti-Animation */}
			{winner && (
				<Confetti
					width={confettiWidth}
					height={confettiHeight}
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						pointerEvents: "none",
						zIndex: 1200,
					}}
				/>
			)}

			{/* Gewinner-Modal */}
			{winner !== null && (
				<Modal open={openModal} onClose={handleCloseModal}>
					<Box
						sx={{
							position: "absolute",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							width: { xs: "90%", sm: 380 },
							bgcolor: "background.paper",
							boxShadow: 24,
							borderRadius: 3,
							p: 4,
							textAlign: "center",
						}}
					>
						<Box
							ref={shareCardRef}
							sx={{
								background:
									"linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(239,248,255,1) 100%)",
								borderRadius: 3,
								border: "1px solid rgba(25, 118, 210, 0.15)",
								p: 3,
								mb: 3,
							}}
						>
							{drawingTopic.trim() && (
								<Typography variant="h6" sx={{ mt: 1 }}>
									{drawingTopic.trim()}
								</Typography>
							)}
							<Typography variant="h4" sx={{ my: 2, color: "green" }}>
								🎉 {winner} 🎉
							</Typography>
							{usedSeedInfo && (
								<Box sx={{ mt: 1.5 }}>
									<Typography variant="body2" color="text.secondary">
										{usedSeedInfo.source === "daily-block" &&
										usedSeedInfo.height !== undefined
											? `Bitcoin Tages-Block #${usedSeedInfo.height}`
											: usedSeedInfo.source === "offline-day-count" &&
												  usedSeedInfo.dayCount !== undefined
												? `Offline-Fallback: ${usedSeedInfo.dayCount} Tage seit dem 28.06.1992`
												: "Verifiziert mit Blockchain-Hash"}
									</Typography>
									{usedSeedInfo.source === "daily-block" &&
										usedSeedInfo.timestamp !== undefined && (
											<Typography
												variant="caption"
												color="text.secondary"
												sx={{ display: "block", mt: 0.5 }}
											>
												{`${formatUnixTimestampAsUtc(usedSeedInfo.timestamp)} UTC`}
											</Typography>
										)}
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ display: "block", mt: 0.5, wordBreak: "break-all" }}
									>
										<Tooltip title={usedSeedInfo.hash}>
											<span>{shortenHash(usedSeedInfo.hash)}</span>
										</Tooltip>
									</Typography>
								</Box>
							)}
						</Box>
						{shareHint && (
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ mb: 2, textAlign: "left" }}
							>
								{shareHint}
							</Typography>
						)}
						<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
							<Button
								variant="contained"
								startIcon={<Share />}
								onClick={handleShareResult}
								disabled={isSharing}
								fullWidth
							>
								{isSharing ? "Teilen..." : "Teilen"}
							</Button>
							<Button variant="outlined" onClick={handleCloseModal} fullWidth>
								OK
							</Button>
						</Stack>
					</Box>
				</Modal>
			)}
			<Box
				sx={{
					mt: 5,
					padding: 2,

					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					flexDirection: "column",
				}}
			>
				{/* <Typography variant="body2">
					&copy; 2025 pascatl. Alle Rechte vorbehalten.
				</Typography> */}
				<Box sx={{ mt: 1 }}>
					<Typography variant="body2">
						{/* <Link href="/impressum" sx={{ mr: 2 }}>
							Impressum
						</Link> */}
						<Link
							href="https://github.com/pascatl/gluecksrad"
							target="_blank"
							sx={{ display: "flex", alignItems: "center" }}
						>
							{/* GitHub-Icon */}
							<GitHub />
						</Link>
					</Typography>
				</Box>
			</Box>
		</Container>
	);
}
