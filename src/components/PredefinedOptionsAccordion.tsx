import { ExpandMore } from "@mui/icons-material";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	Checkbox,
	FormControlLabel,
	Stack,
	Typography,
} from "@mui/material";
import { predefinedOptions } from "../constants/predefinedOptions";

type PredefinedOptionsAccordionProps = {
	expanded: boolean;
	selectedOptions: string[];
	existingItems: string[];
	onExpandedChange: (expanded: boolean) => void;
	onSelectionChange: (option: string, checked: boolean) => void;
	onApply: () => void;
	onReset: () => void;
};

export function PredefinedOptionsAccordion({
	expanded,
	selectedOptions,
	existingItems,
	onExpandedChange,
	onSelectionChange,
	onApply,
	onReset,
}: PredefinedOptionsAccordionProps) {
	return (
		<Accordion
			expanded={expanded}
			onChange={(_, nextExpanded) => onExpandedChange(nextExpanded)}
			sx={{ width: "100%" }}
		>
			<AccordionSummary expandIcon={<ExpandMore />}>
				<Typography variant="h6">Aus vordefinierten Optionen wählen</Typography>
			</AccordionSummary>
			<AccordionDetails>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
							gap: 1,
						}}
					>
						{predefinedOptions.map((option) => (
							<FormControlLabel
								key={option}
								control={
									<Checkbox
										checked={selectedOptions.includes(option)}
										onChange={(event) =>
											onSelectionChange(option, event.target.checked)
										}
										disabled={existingItems.includes(option)}
									/>
								}
								label={option}
							/>
						))}
					</Box>
					<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
						<Button
							variant="contained"
							onClick={onApply}
							disabled={selectedOptions.length === 0}
							fullWidth
						>
							Ausgewählte Optionen hinzufügen ({selectedOptions.length})
						</Button>
						<Button
							variant="outlined"
							onClick={onReset}
							disabled={selectedOptions.length === 0}
							fullWidth
						>
							Auswahl zurücksetzen
						</Button>
					</Stack>
				</Box>
			</AccordionDetails>
		</Accordion>
	);
}
