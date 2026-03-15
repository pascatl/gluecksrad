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

type VerificationAccordionProps = {
	value: string;
	onChange: (value: string) => void;
	onVerify: () => void;
	disabled: boolean;
	hint: string | null;
};

export function VerificationAccordion({
	value,
	onChange,
	onVerify,
	disabled,
	hint,
}: VerificationAccordionProps) {
	return (
		<Accordion sx={{ width: "100%", textAlign: "left" }}>
			<AccordionSummary expandIcon={<ExpandMore />}>
				<Typography variant="h6">Ergebnis verifizieren</Typography>
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
						label="Hash oder Fallback-Seed zur Verifizierung"
						value={value}
						onChange={(event) => onChange(event.target.value)}
						placeholder="Hash oder Offline-Fallback aus dem geteilten Ergebnis einfügen"
						fullWidth
						multiline
						minRows={2}
						helperText="Mit demselben Bitcoin-Hash oder Offline-Fallback-Seed und denselben Optionen lässt sich das Ergebnis jederzeit reproduzieren."
					/>
					<Button variant="outlined" onClick={onVerify} disabled={disabled}>
						Mit Hash verifizieren
					</Button>
					{hint && (
						<Typography variant="body2" color="error">
							{hint}
						</Typography>
					)}
				</Box>
			</AccordionDetails>
		</Accordion>
	);
}
