import { useRef, useState } from "react";
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

// Returns the number of full days elapsed since 1992-06-28
const getDaysSinceReferenceDate = (): number => {
	const referenceDate = new Date("1992-06-28T00:00:00");
	const millisecondsPerDay = 1000 * 60 * 60 * 24;
	return Math.floor(
		(Date.now() - referenceDate.getTime()) / millisecondsPerDay,
	);
};

// Deterministic pseudo-random number in [0, 1) for a given integer seed.
// Multiplying by 10000 amplifies the period of Math.sin so consecutive
// integer seeds produce well-distributed fractional parts.
const seededRandom = (seed: number): number => {
	const x = Math.sin(seed + 1) * 10000;
	return x - Math.floor(x);
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
	const [daysSeed, setDaysSeed] = useState<string>(
		String(getDaysSinceReferenceDate()),
	);
	const [useSeed, setUseSeed] = useState(true);
	const [openSeedInfo, setOpenSeedInfo] = useState(false);
	const [usedSeed, setUsedSeed] = useState<number | null>(null);
	const [isSharing, setIsSharing] = useState(false);
	const [shareHint, setShareHint] = useState<string | null>(null);
	const shareCardRef = useRef<HTMLDivElement | null>(null);

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

	const handleSpin = () => {
		setWheelMode("single");
		if (allOptions.length === 0) return;
		setShareHint(null);
		const parsed = parseInt(daysSeed.trim(), 10);
		const seed = !isNaN(parsed) ? parsed : getDaysSinceReferenceDate();
		const randomValue = useSeed ? seededRandom(seed) : Math.random();
		const randomIndex = Math.floor(randomValue * allOptions.length);
		setUsedSeed(useSeed ? seed : null);
		setPrizeNumber(randomIndex);
		setMustSpin(true);
	};

	const handleCloseModal = () => {
		setOpenModal(false);
		setWinner(null);
		setShareHint(null);
	};

	const handleCloseSeedInfo = () => {
		setOpenSeedInfo(false);
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

			const imageFile = new File([imageBlob], "gluecksrad-ergebnis.png", {
				type: "image/png",
			});

			const topicPrefix = drawingTopic.trim()
				? `Thema: ${drawingTopic.trim()}\n`
				: "";
			const shareText =
				usedSeed !== null
					? `${topicPrefix}🎉 Glücksrad-Ergebnis: ${winner}\nSeed: ${usedSeed} (Tage seit dem 28.06.1992)`
					: `${topicPrefix}🎉 Glücksrad-Ergebnis: ${winner}\nOhne Seed erzeugt`;

			const shareData: ShareData = {
				title: "Glücksrad Ergebnis",
				text: shareText,
				files: [imageFile],
			};

			if (navigator.canShare?.(shareData)) {
				await navigator.share(shareData);
				return;
			}

			if (navigator.share) {
				await navigator.share({
					title: "Glücksrad Ergebnis",
					text: shareText,
				});
				setShareHint(
					"Auf diesem Gerät kann nur der Text direkt geteilt werden. Der Screenshot wurde zusätzlich heruntergeladen.",
				);
			} else {
				setShareHint(
					"Direktes Teilen wird hier nicht unterstützt. Der Screenshot wurde heruntergeladen.",
				);
			}

			const downloadUrl = URL.createObjectURL(imageBlob);
			const link = document.createElement("a");
			link.href = downloadUrl;
			link.download = imageFile.name;
			link.click();
			URL.revokeObjectURL(downloadUrl);
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
					flexWrap: "wrap",
					gap: 2,
					mt: 3,
				}}
			>
				<FormControlLabel
					control={
						<Checkbox
							checked={useSeed}
							onChange={(e) => setUseSeed(e.target.checked)}
						/>
					}
					label="Seed verwenden"
				/>
				<Tooltip title="Info zum Seed">
					<IconButton
						aria-label="Seed-Informationen anzeigen"
						onClick={() => setOpenSeedInfo(true)}
					>
						<InfoOutlined />
					</IconButton>
				</Tooltip>
				<TextField
					label="Seed-Wert"
					type="number"
					variant="outlined"
					size="small"
					value={daysSeed}
					onChange={(e) => setDaysSeed(e.target.value)}
					placeholder={`Heute: ${getDaysSinceReferenceDate()}`}
					disabled={!useSeed}
					sx={{ width: 220 }}
				/>
				<Button
					variant="contained"
					onClick={handleSpin}
					disabled={allOptions.length === 0}
				>
					Drehen
				</Button>
			</Box>

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
						Der Seed-Wert bestimmt den Zufallswert für die Drehung
						reproduzierbar. Wenn derselbe Seed und dieselben Optionen verwendet
						werden, landet das Glücksrad immer wieder auf derselben Option.
					</Typography>
					<Typography variant="body1" sx={{ mb: 2 }}>
						Ist die Checkbox <strong>"Seed verwenden"</strong> aktiviert, wird
						der eingegebene Wert genutzt. Bleibt das Feld leer, wird automatisch
						der heutige Tag seit dem 28.06.1992 verwendet. Dadurch ist das
						Ergebnis für diesen Tag stabil und nachvollziehbar.
					</Typography>
					<Typography variant="body1" sx={{ mb: 3 }}>
						Ist die Checkbox deaktiviert, wird bei jeder Drehung ein neuer
						echter Zufallswert verwendet. Dann kann das Glücksrad bei jedem
						Klick anders ausgehen, auch wenn sich die Optionen nicht geändert
						haben.
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
			{winner && <Confetti width={width} height={height} />}

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
							<Typography variant="overline" sx={{ letterSpacing: 1.2 }}>
								Glücksrad Ergebnis
							</Typography>
							{drawingTopic.trim() && (
								<Typography variant="h6" sx={{ mt: 1 }}>
									{drawingTopic.trim()}
								</Typography>
							)}
							<Typography variant="h4" sx={{ my: 2, color: "green" }}>
								🎉 {winner} 🎉
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{usedSeed !== null
									? `Seed: ${usedSeed}`
									: "Seed nicht verwendet"}
							</Typography>
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
