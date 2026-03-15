import { GitHub } from "@mui/icons-material";
import { Box, Link, Typography } from "@mui/material";

export function AppFooter() {
	return (
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
			<Box sx={{ mt: 1 }}>
				<Typography variant="body2">
					<Link
						href="https://github.com/pascatl/gluecksrad"
						target="_blank"
						sx={{ display: "flex", alignItems: "center" }}
					>
						<GitHub />
					</Link>
				</Typography>
			</Box>
		</Box>
	);
}
