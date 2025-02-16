import { useState } from "react";
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
} from "@mui/material";
import { Delete, GitHub } from "@mui/icons-material";
import { useWindowSize } from "@react-hook/window-size";

// Funktion zur Generierung von kontrastreichen Farben
const generateContrastingColors = (count: number): string[] => {
	const colors: string[] = [];
	for (let i = 0; i < count; i++) {
		const hue = (i * (360 / count)) % 360;
		colors.push(`hsl(${hue}, 80%, 50%)`);
	}
	return colors;
};

export default function App() {
	const [items, setItems] = useState<string[]>([]);
	const [newItem, setNewItem] = useState("");
	const [winner, setWinner] = useState<string | null>(null);
	const [mustSpin, setMustSpin] = useState(false);
	const [prizeNumber, setPrizeNumber] = useState(0);
	const [openModal, setOpenModal] = useState(false);
	const [width, height] = useWindowSize();

	const handleAddItem = () => {
		if (newItem.trim() !== "") {
			setItems([...items, newItem.trim()]);
			setNewItem("");
		}
	};

	const handleRemoveItem = (index: number) => {
		setItems(items.filter((_, i) => i !== index));
	};

	const handleSpin = () => {
		if (items.length === 0) return;
		const randomIndex = Math.floor(Math.random() * items.length);
		setPrizeNumber(randomIndex);
		setMustSpin(true);
	};

	const handleCloseModal = () => {
		setOpenModal(false);
		setWinner(null);
	};

	const colors = generateContrastingColors(items.length);
	const wheelData =
		items.length > 0
			? items.map((item, index) => ({
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
						setWinner(items.length > 0 ? items[prizeNumber] : null);
						setOpenModal(true);
					}}
					spinDuration={0.5}
				/>
			</Box>
			<Button
				variant="contained"
				sx={{ mt: 3 }}
				onClick={handleSpin}
				disabled={items.length === 0}
			>
				Drehen
			</Button>

			{/* Konfetti-Animation */}
			{winner && <Confetti width={width} height={height} />}

			{/* Gewinner-Modal */}
			<Modal open={openModal} onClose={handleCloseModal}>
				<Box
					sx={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						width: 300,
						bgcolor: "background.paper",
						boxShadow: 24,
						borderRadius: 3,
						p: 4,
						textAlign: "center",
					}}
				>
					<Typography variant="h4" sx={{ mb: 5, color: "green" }}>
						🎉 {winner} 🎉
					</Typography>
					{/* <Typography variant="h5" sx={{ color: "green", mb: 3 }}>
						{winner}
					</Typography> */}
					<Button variant="contained" onClick={handleCloseModal}>
						OK
					</Button>
				</Box>
			</Modal>
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
