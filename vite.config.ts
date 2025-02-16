import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			workbox: {
				clientsClaim: true,
				skipWaiting: true, // Neuer Service Worker ersetzt direkt den alten
				runtimeCaching: [
					// {
					// 	urlPattern: /^https:\/\/fonts\.googleapis\.com/,
					// 	handler: "CacheFirst",
					// 	options: {
					// 		cacheName: "google-fonts-cache",
					// 		expiration: {
					// 			maxEntries: 30,
					// 			maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Jahr
					// 		},
					// 	},
					// },
					{
						urlPattern: /\/assets\//,
						handler: "CacheFirst",
						options: {
							cacheName: "assets-cache",
						},
					},
				],
			},
			manifest: {
				name: "Glücksrad",
				short_name: "Glücksrad",
				description: "Widersetze dich nicht der Entscheidung des Glücksrads!",
				theme_color: "#242424",
				background_color: "#ffffff",
				icons: [
					{
						src: "/icon-512px.png",
						sizes: "512x512",
						type: "image/png",
					},
				],
			},
		}),
	],
});
