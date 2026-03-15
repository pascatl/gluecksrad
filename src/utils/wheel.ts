export const generateContrastingColors = (count: number): string[] => {
	const colors: string[] = [];
	for (let i = 0; i < count; i++) {
		const hue = (i * (360 / count)) % 360;
		colors.push(`hsl(${hue}, 80%, 50%)`);
	}
	return colors;
};

export const createTeams = (
	options: string[],
	numTeams: number,
): string[][] => {
	if (options.length < 2 || numTeams < 2 || numTeams > options.length) {
		return [];
	}

	const shuffled = [...options].sort(() => 0.5 - Math.random());
	const baseSize = Math.floor(shuffled.length / numTeams);
	const remainder = shuffled.length % numTeams;
	const sizes = Array(numTeams).fill(baseSize);

	for (let i = 0; i < remainder; i++) {
		sizes[i] += 1;
	}

	const teams: string[][] = [];
	let start = 0;

	for (let i = 0; i < numTeams; i++) {
		const end = start + sizes[i];
		teams.push(shuffled.slice(start, end));
		start = end;
	}

	return teams;
};
