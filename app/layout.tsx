import { Footer } from "@/components/Layout/Footer";
import { Navbar } from "@/components/Layout/Navbar";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
	display: "swap", // Optimize font loading
	preload: true,
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
	display: "swap", // Optimize font loading
	preload: false, // Only load when needed
});

export const metadata = {
	title: "Better Bahn - Split-Ticketing",
	description: "Eine App von Lukas Weihrauch",
	keywords: "Deutsche Bahn, Split-Ticketing, Günstige Bahntickets, Sparpreise",
	robots: "index, follow",
};

export const viewport = {
	width: "device-width",
	initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="de">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased container mx-auto px-2 py-6`}
			>
				<Navbar />
				<main>
					{children}
				</main>
				<Footer />
			</body>
		</html>
	);
}
