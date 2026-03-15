import { ExpandMore } from "@mui/icons-material";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	TextField,
	Typography,
} from "@mui/material";

type TeamModeAccordionProps = {
	teamCount: number;
	allOptionsCount: number;
	onTeamCountChange: (count: number) => void;
	onGenerateTeams: () => void;
};

export function TeamModeAccordion({
	teamCount,
	allOptionsCount,
	onTeamCountChange,
	onGenerateTeams,
}: TeamModeAccordionProps) {
	return (
		<Accordion sx={{ width: "100%", textAlign: "left" }}>
			<AccordionSummary expandIcon={<ExpandMore />}>
				<Typography variant="h6">Team Modus</Typography>
			</AccordionSummary>
			<AccordionDetails>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
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
						onChange={(event) => {
							const value = Number(event.target.value);
							onTeamCountChange(value >= 2 ? value : 2);
						}}
						sx={{ width: 140 }}
					/>
					<Button
						variant="contained"
						onClick={onGenerateTeams}
						disabled={teamCount < 2 || teamCount * 2 - 1 > allOptionsCount}
					>
						{teamCount} Glücksrad Teams generieren
					</Button>
				</Box>
			</AccordionDetails>
		</Accordion>
	);
}
