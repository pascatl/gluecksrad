import { Wheel } from "react-custom-roulette";
import GroupIcon from "@mui/icons-material/Group";
import { Box, Card, CardContent, CardHeader, Typography } from "@mui/material";
import type { WheelDataItem, WheelMode } from "../types/wheel";
import { generateContrastingColors } from "../utils/wheel";

type WheelSectionProps = {
	mustSpin: boolean;
	prizeNumber: number;
	wheelData: WheelDataItem[];
	wheelScale: number;
	wheelViewportHeight: number;
	overlayWheelScale: number;
	wheelMode: WheelMode;
	teams: string[][];
	onStopSpinning: () => void;
};

export function WheelSection({
	mustSpin,
	prizeNumber,
	wheelData,
	wheelScale,
	wheelViewportHeight,
	overlayWheelScale,
	wheelMode,
	teams,
	onStopSpinning,
}: WheelSectionProps) {
	const wheelTransform = mustSpin
		? `translate(-50%, -50%) scale(${overlayWheelScale})`
		: `scale(${wheelScale})`;
	const transitionDuration = "240ms";

	return (
		<>
			<Box
				sx={{
					position: "fixed",
					inset: 0,
					bgcolor: "rgba(15, 23, 42, 0.68)",
					backdropFilter: mustSpin ? "blur(4px)" : "blur(0px)",
					opacity: mustSpin ? 1 : 0,
					pointerEvents: mustSpin ? "auto" : "none",
					transition: `opacity ${transitionDuration} ease, backdrop-filter ${transitionDuration} ease`,
					zIndex: 1399,
				}}
			/>

			<Box
				sx={{
					width: "100%",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					mt: 1,
					overflow: "hidden",
					minHeight: wheelViewportHeight,
					WebkitOverflowScrolling: "auto",
				}}
			>
				<Box
					sx={{
						position: mustSpin ? "fixed" : "relative",
						top: mustSpin ? "50%" : "auto",
						left: mustSpin ? "50%" : "auto",
						zIndex: mustSpin ? 1400 : "auto",
						transform: wheelTransform,
						transformOrigin: "center center",
						filter: mustSpin
							? "drop-shadow(0 24px 48px rgba(0, 0, 0, 0.3))"
							: "drop-shadow(0 0 0 rgba(0, 0, 0, 0))",
						transition: `transform ${transitionDuration} cubic-bezier(0.22, 1, 0.36, 1), top ${transitionDuration} ease, left ${transitionDuration} ease, filter ${transitionDuration} ease`,
						willChange: mustSpin ? "transform" : "auto",
					}}
				>
					<Wheel
						mustStartSpinning={mustSpin}
						prizeNumber={prizeNumber}
						data={wheelData}
						onStopSpinning={onStopSpinning}
						spinDuration={0.5}
					/>
				</Box>
			</Box>

			{!mustSpin && wheelMode === "teams" && (
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
						gap: 2,
						mt: 1,
					}}
				>
					{teams.map((team, index) => {
						const teamColors = generateContrastingColors(teams.length);
						return (
							<Card
								key={`${index}-${team.join("-")}`}
								sx={{
									background: teamColors[index],
									color: "#000000ff",
								}}
							>
								<CardHeader title={`Team ${index + 1}`} />
								<CardContent>
									{team.map((member, memberIndex) => (
										<Typography
											key={`${member}-${memberIndex}`}
											variant="body1"
										>
											{member}
										</Typography>
									))}
									<Box sx={{ mt: 2 }}>
										<GroupIcon htmlColor="#000" />
									</Box>
								</CardContent>
							</Card>
						);
					})}
				</Box>
			)}
		</>
	);
}
