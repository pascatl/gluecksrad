import { ContentCopy, InfoOutlined } from "@mui/icons-material";
import {
	Box,
	Button,
	Checkbox,
	FormControlLabel,
	IconButton,
	Tooltip,
	Typography,
} from "@mui/material";
import type { BlockchainSeedInfo } from "../types/seed";
import { formatUnixTimestampAsUtc, shortenHash } from "../utils/seed";

type SeedControlsProps = {
	useSeed: boolean;
	onUseSeedChange: (checked: boolean) => void;
	onOpenSeedInfo: () => void;
	currentSeedInfo: BlockchainSeedInfo | null;
	isUsingOfflineSeedFallback: boolean;
	seedCopyHint: string | null;
	onCopySeedHash: (hash: string) => void;
	onSpin: () => void;
	canSpin: boolean;
	isLoadingSeed: boolean;
};

export function SeedControls({
	useSeed,
	onUseSeedChange,
	onOpenSeedInfo,
	currentSeedInfo,
	isUsingOfflineSeedFallback,
	seedCopyHint,
	onCopySeedHash,
	onSpin,
	canSpin,
	isLoadingSeed,
}: SeedControlsProps) {
	return (
		<Box sx={{ width: "100%", maxWidth: 560, mx: "auto" }}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					flexWrap: "wrap",
					gap: 1,
					mb: 1.5,
				}}
			>
				<FormControlLabel
					sx={{ mr: 0 }}
					control={
						<Checkbox
							checked={useSeed}
							onChange={(event) => onUseSeedChange(event.target.checked)}
						/>
					}
					label="Blockchain-Seed verwenden"
				/>
				<Tooltip title="Info zum Seed">
					<IconButton
						sx={{ ml: -0.5 }}
						aria-label="Seed-Informationen anzeigen"
						onClick={onOpenSeedInfo}
					>
						<InfoOutlined />
					</IconButton>
				</Tooltip>
			</Box>
			{useSeed && (
				<Box sx={{ mb: 2, textAlign: "left" }}>
					<Typography variant="body2" sx={{ mb: 0.75 }}>
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
										onCopySeedHash(currentSeedInfo.hash)
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
						sx={{ display: "block", mt: 0.75 }}
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
							sx={{ display: "block", mt: 0.5 }}
						>
							{seedCopyHint}
						</Typography>
					)}
				</Box>
			)}
			<Button
				variant="contained"
				onClick={onSpin}
				disabled={!canSpin || isLoadingSeed}
				size="large"
				fullWidth
				sx={{ py: 1.5, fontSize: "1.05rem", fontWeight: 700, boxShadow: 4 }}
			>
				{isLoadingSeed ? "Blockchain wird geladen..." : "Drehen"}
			</Button>
		</Box>
	);
}
