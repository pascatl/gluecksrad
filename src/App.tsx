import React, { useState } from "react";
import { Wheel } from "react-custom-roulette";
import {
	Button,
	TextField,
	Container,
	Box,
	Typography,
	List,
	ListItem,
	IconButton,
} from "@mui/material";
import { Delete } from "@mui/icons-material";

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
	const [items, setItems] = useState<string[]>(["Option"]); // Kein voreingestellter Wert
	const [newItem, setNewItem] = useState("");
	const [winner, setWinner] = useState<string | null>(null);
	const [mustSpin, setMustSpin] = useState(false);
	const [prizeNumber, setPrizeNumber] = useState(0);

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
			<Typography variant="h4" sx={{ m: 5 }} gutterBottom>
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
						sx={{ border: 1, borderRadius: "5px", borderColor: "lightgray" }}
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
					}}
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
			{winner && (
				<Typography variant="h5" sx={{ mt: 3, color: "green" }}>
					Gewinner: {winner}
				</Typography>
			)}
		</Container>
	);
}
