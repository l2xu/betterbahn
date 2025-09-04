"use client";
import Link from "next/link";
import { useState } from "react";

export const Navbar = () => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	return (
		<header className="relative mb-12 ">
			<nav
				className="flex justify-between items-center uppercase"
				role="navigation"
				aria-label="Hauptnavigation"
			>
				{/* Logo/Markenname */}
				<div className="text-xs sm:text-lg md:text-xl">
					<Link href="/" className="no-underline">
						<span className="sr-only">Better Bahn - Startseite</span>
						<span className="font-bold border-primary text-primary dark:text-foreground dark:border-foreground rounded-xl p-1.5 border-4">
							Better Bahn
						</span>{" "}
					</Link>
				</div>

				{/* Mobile Menü Button */}
				<button
					onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
					className="md:hidden p-2 rounded-md text-primary hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
					aria-expanded={isMobileMenuOpen}
					aria-controls="mobile-menu"
					aria-label="Navigationsmenü"
				>
					<span className="sr-only">
						{isMobileMenuOpen ? "Menü schließen" : "Menü öffnen"}
					</span>
					{/* Hamburger Icon */}
					<svg
						className="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						{isMobileMenuOpen ? (
							/* X Icon für Schließen */
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						) : (
							/* Hamburger Icon */
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 6h16M4 12h16M4 18h16"
							/>
						)}
					</svg>
				</button>

				{/* Mobile Navigation Menu */}
				{/* Overlay */}
				{isMobileMenuOpen && (
					<div
						className="fixed inset-0 bg-primary/20 z-40 md:hidden"
						onClick={() => setIsMobileMenuOpen(false)}
						aria-hidden="true"
					/>
				)}

				{/* Slide-in Menu */}
				<div
					id="mobile-menu"
					className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg md:hidden transition-transform duration-300 ease-in-out z-50 ${
						isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
					}`}
				>
					<div className="p-6 space-y-4">
						{/* Close button in mobile menu */}
						<div className="flex justify-end mb-6">
							<button
								onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
								className="p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
								aria-label="Menü schließen"
							>
								<svg
									className="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>
			</nav>
		</header>
	);
};
