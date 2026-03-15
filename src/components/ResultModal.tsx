import type { RefObject } from "react";
import { Share } from "@mui/icons-material";
import { Box, Button, Modal, Stack, Tooltip, Typography } from "@mui/material";
import type { BlockchainSeedInfo } from "../types/seed";
import { formatUnixTimestampAsUtc, shortenHash } from "../utils/seed";

type ResultModalProps = {
	open: boolean;
	winner: string | null;
	drawingTopic: string;
	usedSeedInfo: BlockchainSeedInfo | null;
	shareHint: string | null;
	isSharing: boolean;
	onShare: () => void;
	onClose: () => void;
	shareCardRef: RefObject<HTMLDivElement | null>;
};

export function ResultModal({
	open,
	winner,
	drawingTopic,
	usedSeedInfo,
	shareHint,
	isSharing,
	onShare,
	onClose,
	shareCardRef,
}: ResultModalProps) {
	if (winner === null) {
		return null;
	}

	return (
		<Modal open={open} onClose={onClose}>
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
						onClick={onShare}
						disabled={isSharing}
						fullWidth
					>
						{isSharing ? "Teilen..." : "Teilen"}
					</Button>
					<Button variant="outlined" onClick={onClose} fullWidth>
						OK
					</Button>
				</Stack>
			</Box>
		</Modal>
	);
}
