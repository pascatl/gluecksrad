export const sanitizeFilenamePart = (value: string): string =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9äöüß]+/gi, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 50);

export const createTimestamp = (): string => {
	const now = new Date();
	const pad = (value: number): string => String(value).padStart(2, "0");

	return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

export const downloadImage = (imageBlob: Blob, fileName: string) => {
	const downloadUrl = URL.createObjectURL(imageBlob);
	const link = document.createElement("a");
	link.href = downloadUrl;
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(downloadUrl);
};
