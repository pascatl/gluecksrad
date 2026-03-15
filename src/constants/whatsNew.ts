export type WhatsNewMessage = {
	id: string;
	title: string;
	intro?: string;
	items: string[];
};

export const WHATS_NEW_STORAGE_KEY = "gluecksrad-whats-new-seen";

export const whatsNewMessages: WhatsNewMessage[] = [
	{
		id: "2026-03-wheel-updates",
		title: "Neu in dieser Version",
		intro: "",
		items: [
			"Blockchain-Seed mit täglichem Bitcoin-Block und Offline-Fallback",
			"Verifizierung über Hash oder Fallback-Seed",
			"Teilen des Ergebnisses als Bild inklusive Seed-Informationen",
			"Große, zentrierte Rad-Animation beim Drehen",
		],
	},
];
