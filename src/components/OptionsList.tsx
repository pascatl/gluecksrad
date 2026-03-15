import { Delete } from "@mui/icons-material";
import { IconButton, List, ListItem } from "@mui/material";

type OptionsListProps = {
	items: string[];
	onRemove: (index: number) => void;
};

export function OptionsList({ items, onRemove }: OptionsListProps) {
	return (
		<List sx={{ width: "100%", p: 0 }}>
			{items.map((item, index) => (
				<ListItem
					sx={{
						border: 1,
						borderRadius: 2,
						borderColor: "divider",
						mb: 1,
						pr: 7,
					}}
					key={`${item}-${index}`}
					secondaryAction={
						<IconButton edge="end" onClick={() => onRemove(index)}>
							<Delete />
						</IconButton>
					}
				>
					{item}
				</ListItem>
			))}
		</List>
	);
}
