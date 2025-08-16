// Importiere React
import React from "react";

// Footer-Komponente für die Fußzeile der Seite
export const Footer = () => {
	return (
		<section className="py-16 text-center">
			<p className="text-gray-600">
				Ein Projekt von Lukas Weihrauch |{" "}
				<a
					href="https://github.com/l2xu/betterbahn"
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-600 hover:text-blue-800 underline"
				>
					GitHub
				</a>
			</p>
		</section>
	);
};
