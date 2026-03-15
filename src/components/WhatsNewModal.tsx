import { Box, Button, Modal, Typography } from "@mui/material";
import type { WhatsNewMessage } from "../constants/whatsNew";

type WhatsNewModalProps = {
	open: boolean;
	onClose: () => void;
	message: WhatsNewMessage | null;
};

export function WhatsNewModal({ open, onClose, message }: WhatsNewModalProps) {
	if (!message) {
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
					width: { xs: "90%", sm: 520 },
					bgcolor: "background.paper",
					boxShadow: 24,
					borderRadius: 3,
					p: 4,
					textAlign: "left",
				}}
			>
				<Typography variant="h5" sx={{ mb: 2 }}>
					{message.title}
				</Typography>

				{message.intro && (
					<Typography variant="body1" sx={{ mb: 2 }}>
						{message.intro}
					</Typography>
				)}

				<Box component="ul" sx={{ pl: 3, my: 0, mb: 3 }}>
					{message.items.map((item, index) => (
						<Box
							component="li"
							key={`${message.id}-${index}`}
							sx={{ mb: index < message.items.length - 1 ? 1 : 0 }}
						>
							<Typography variant="body1">{item}</Typography>
						</Box>
					))}
				</Box>
				<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
					<Button variant="contained" onClick={onClose}>
						Verstanden
					</Button>
				</Box>
			</Box>
		</Modal>
	);
}
