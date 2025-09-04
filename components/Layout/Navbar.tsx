import Link from "next/link";

export const Navbar = () => {
	return (
		<header className="relative py-4">
			<nav
				className="flex justify-center md:justify-start items-center uppercase"
				role="navigation"
				aria-label="Hauptnavigation"
			>
				{/* Logo/Markenname */}
				<div className="text-xs sm:text-lg md:text-xl">
					<Link href="/" className="no-underline">
						<span className="sr-only">Better Bahn - Startseite</span>
						<span className="font-bold border-primary text-primary dark:text-foreground dark:border-foreground rounded-xl p-1.5 border-4">
							Better Bahn
						</span>
					</Link>
				</div>
			</nav>
		</header>
	);
};
