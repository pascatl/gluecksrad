import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import Confetti from "react-confetti";
import {
	Box,
	Button,
	Container,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { useWindowSize } from "@react-hook/window-size";
import { AppFooter } from "./components/AppFooter";
import { OptionsList } from "./components/OptionsList";
import { PredefinedOptionsAccordion } from "./components/PredefinedOptionsAccordion";
import { ResultModal } from "./components/ResultModal";
import { SeedControls } from "./components/SeedControls";
import { SeedInfoModal } from "./components/SeedInfoModal";
import { TeamModeAccordion } from "./components/TeamModeAccordion";
import { VerificationAccordion } from "./components/VerificationAccordion";
import { WhatsNewModal } from "./components/WhatsNewModal";
import { WheelSection } from "./components/WheelSection";
import {
	WHATS_NEW_STORAGE_KEY,
	whatsNewMessages,
	type WhatsNewMessage,
} from "./constants/whatsNew";
import { useBodyScrollLock } from "./hooks/useBodyScrollLock";
import type { BlockchainSeedInfo } from "./types/seed";
import type { WheelDataItem, WheelMode } from "./types/wheel";
import {
	cacheDailySeed,
	createOfflineDayCountSeed,
	fetchFirstBlockOfCurrentUtcDay,
	getCurrentUtcDayStartTimestamp,
	readCachedDailySeed,
	seededRandomFromHash,
	seededRandomFromNumber,
} from "./utils/seed";
import {
	createTimestamp,
	downloadImage,
	sanitizeFilenamePart,
} from "./utils/share";
import { createTeams, generateContrastingColors } from "./utils/wheel";

export default function App() {
	const [items, setItems] = useState<string[]>([]);
	const [newItem, setNewItem] = useState("");
	const [drawingTopic, setDrawingTopic] = useState("");
	const [winner, setWinner] = useState<string | null>(null);
	const [showConfetti, setShowConfetti] = useState(false);
	const [mustSpin, setMustSpin] = useState(false);
	const [prizeNumber, setPrizeNumber] = useState(0);
	const [openModal, setOpenModal] = useState(false);
	const [isPredefinedAccordionOpen, setIsPredefinedAccordionOpen] =
		useState(false);
	const [selectedPredefined, setSelectedPredefined] = useState<string[]>([]);
	const [width, height] = useWindowSize();
	const [teamCount, setTeamCount] = useState(2);
	const [teams, setTeams] = useState<string[][]>([]);
	const [wheelMode, setWheelMode] = useState<WheelMode>("single");
	const [useSeed, setUseSeed] = useState(true);
	const [openSeedInfo, setOpenSeedInfo] = useState(false);
	const [activeWhatsNewMessage, setActiveWhatsNewMessage] =
		useState<WhatsNewMessage | null>(null);
	const [openWhatsNew, setOpenWhatsNew] = useState(false);
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

	useBodyScrollLock(mustSpin);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		let seenMessageIds: string[] = [];

		try {
			const rawValue = window.localStorage.getItem(WHATS_NEW_STORAGE_KEY);
			seenMessageIds = rawValue ? (JSON.parse(rawValue) as string[]) : [];
		} catch {
			seenMessageIds = [];
		}

		const latestUnseenMessage = [...whatsNewMessages]
			.reverse()
			.find((message) => !seenMessageIds.includes(message.id));

		if (latestUnseenMessage) {
			setActiveWhatsNewMessage(latestUnseenMessage);
			setOpenWhatsNew(true);
		}
	}, []);

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
		setItems(items.filter((_, currentIndex) => currentIndex !== index));
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
		const newItems = [...items];
		selectedPredefined.forEach((option) => {
			if (!newItems.includes(option)) {
				newItems.push(option);
			}
		});

		setItems(newItems);
		setSelectedPredefined([]);
		setIsPredefinedAccordionOpen(false);
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
		setShowConfetti(false);
		setShareHint(null);
	};

	const handleCloseWhatsNew = () => {
		setOpenWhatsNew(false);
		if (!activeWhatsNewMessage) {
			return;
		}

		if (typeof window === "undefined") {
			setActiveWhatsNewMessage(null);
			return;
		}

		try {
			const rawValue = window.localStorage.getItem(WHATS_NEW_STORAGE_KEY);
			const seenMessageIds = rawValue ? (JSON.parse(rawValue) as string[]) : [];
			const nextSeenMessageIds = Array.from(
				new Set([...seenMessageIds, activeWhatsNewMessage.id]),
			);

			window.localStorage.setItem(
				WHATS_NEW_STORAGE_KEY,
				JSON.stringify(nextSeenMessageIds),
			);
		} catch {
			// Ignore persistence errors.
		}

		setActiveWhatsNewMessage(null);
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

	const handleTeamSelection = () => {
		setWheelMode("teams");
		setSpinHint(null);
		setTeams([]);
		setMustSpin(true);
		setTeams(createTeams(allOptions, teamCount));
	};

	const allOptions = [...items];
	const colors = generateContrastingColors(allOptions.length);
	const wheelData: WheelDataItem[] =
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
	const wheelScale = Math.min(1, Math.max(0.72, (width - 32) / 520));
	const wheelViewportHeight = 520 * wheelScale;
	const overlayWheelScale = Math.max(
		0.78,
		Math.min(1.18, Math.min((width - 48) / 520, (height - 96) / 520)),
	);

	const handleWheelStopSpinning = () => {
		setMustSpin(false);
		setShowConfetti(true);
		setWinner(
			allOptions.length > 0 && wheelMode !== "teams"
				? allOptions[prizeNumber]
				: null,
		);
		setOpenModal(true);
	};

	return (
		<Container
			maxWidth="lg"
			sx={{
				py: { xs: 3, md: 4 },
				overflowX: "hidden",
				textAlign: "center",
			}}
		>
			<Box sx={{ mb: 4 }}>
				<Typography variant="h2" sx={{ mb: 3 }} gutterBottom>
					Glücksrad
				</Typography>
			</Box>

			<Box
				sx={{
					width: "100%",
					maxWidth: 900,
					mx: "auto",
					display: "flex",
					flexDirection: "column",
					gap: 3,
				}}
			>
				<Box sx={{ display: "flex", justifyContent: "center" }}>
					<TextField
						label="Thema der Auslosung (optional)"
						variant="outlined"
						value={drawingTopic}
						onChange={(event) => setDrawingTopic(event.target.value)}
						fullWidth
						sx={{ maxWidth: 520 }}
					/>
				</Box>

				<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
					<TextField
						label="Neue Option"
						variant="outlined"
						value={newItem}
						onChange={(event) => setNewItem(event.target.value)}
						fullWidth
					/>
					<Button
						variant="contained"
						onClick={handleAddItem}
						sx={{ minWidth: { sm: 160 } }}
					>
						Hinzufügen
					</Button>
				</Stack>

				<PredefinedOptionsAccordion
					expanded={isPredefinedAccordionOpen}
					selectedOptions={selectedPredefined}
					existingItems={items}
					onExpandedChange={setIsPredefinedAccordionOpen}
					onSelectionChange={handlePredefinedSelection}
					onApply={handleApplySelectedOptions}
					onReset={() => setSelectedPredefined([])}
				/>

				<TeamModeAccordion
					teamCount={teamCount}
					allOptionsCount={allOptions.length}
					onTeamCountChange={setTeamCount}
					onGenerateTeams={handleTeamSelection}
				/>

				<OptionsList items={items} onRemove={handleRemoveItem} />

				<WheelSection
					mustSpin={mustSpin}
					prizeNumber={prizeNumber}
					wheelData={wheelData}
					wheelScale={wheelScale}
					wheelViewportHeight={wheelViewportHeight}
					overlayWheelScale={overlayWheelScale}
					wheelMode={wheelMode}
					teams={teams}
					onStopSpinning={handleWheelStopSpinning}
				/>

				<SeedControls
					useSeed={useSeed}
					onUseSeedChange={setUseSeed}
					onOpenSeedInfo={() => setOpenSeedInfo(true)}
					currentSeedInfo={currentSeedInfo}
					isUsingOfflineSeedFallback={isUsingOfflineSeedFallback}
					seedCopyHint={seedCopyHint}
					onCopySeedHash={handleCopySeedHash}
					onSpin={handleSpin}
					canSpin={allOptions.length > 0}
					isLoadingSeed={isLoadingSeed}
				/>

				<VerificationAccordion
					value={verificationHash}
					onChange={setVerificationHash}
					onVerify={handleVerifyWithHash}
					disabled={mustSpin || verificationHash.trim() === ""}
					hint={verificationHint}
				/>

				{spinHint && (
					<Typography variant="body2" color="error" sx={{ mt: -1 }}>
						{spinHint}
					</Typography>
				)}
			</Box>

			<SeedInfoModal
				open={openSeedInfo}
				onClose={() => setOpenSeedInfo(false)}
			/>

			<WhatsNewModal
				open={openWhatsNew}
				onClose={handleCloseWhatsNew}
				message={activeWhatsNewMessage}
			/>

			{showConfetti && (
				<Confetti
					width={confettiWidth}
					height={confettiHeight}
					run
					recycle
					numberOfPieces={500}
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						pointerEvents: "none",
						zIndex: 1200,
					}}
				/>
			)}

			<ResultModal
				open={openModal}
				winner={winner}
				drawingTopic={drawingTopic}
				usedSeedInfo={usedSeedInfo}
				shareHint={shareHint}
				isSharing={isSharing}
				onShare={handleShareResult}
				onClose={handleCloseModal}
				shareCardRef={shareCardRef}
			/>

			<AppFooter />
		</Container>
	);
}
