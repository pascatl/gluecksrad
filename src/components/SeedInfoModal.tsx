import { Box, Button, Modal, Typography } from "@mui/material";

type SeedInfoModalProps = {
	open: boolean;
	onClose: () => void;
};

export function SeedInfoModal({ open, onClose }: SeedInfoModalProps) {
	return (
		<Modal open={open} onClose={onClose}>
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
					Ist die Checkbox deaktiviert, wird bei jeder Drehung ein neuer echter
					Zufallswert verwendet. Dann ist die Drehung nicht an einen
					Blockchain-Hash gebunden und kann bei jedem Klick anders ausgehen. Für
					den Blockchain-Seed ist eine Internetverbindung nötig. Vor dem ersten
					Bitcoin-Block des UTC-Tages ist noch kein Tages-Seed verfügbar. Falls
					offline weder ein aktueller Block noch ein Cache-Wert verfügbar ist,
					wird als Fallback die Tagesanzahl seit dem 28.06.1992 verwendet. Mit
					der Verifizierungsfunktion kann ein bereits bekannter Hash oder dieser
					Fallback-Wert später erneut eingesetzt werden, um dasselbe Ergebnis
					nachzurechnen.
				</Typography>
				<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
					<Button variant="contained" onClick={onClose}>
						Verstanden
					</Button>
				</Box>
			</Box>
		</Modal>
	);
}
