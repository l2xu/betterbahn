"use client";

import type { VendoJourney } from "@/utils/schemas";
import { JourneyCard } from "./JourneyCard/JourneyCard";

// Komponente zur Anzeige aller gefundenen Verbindungen
export const JourneyResults = ({
	journeys,
	travelClass,
	onJourneySelect,
	selectedJourney,
}: {
	journeys: VendoJourney[];
	travelClass?: string;
	onJourneySelect?: (journey: VendoJourney, index: number) => unknown;
	selectedJourney: VendoJourney | null;
}) => {
	// Zeige nichts an, falls keine Verbindungen vorhanden
	if (journeys.length === 0) {
		return null;
	}

	return (
		<div className="bg-background rounded-lg shadow-md p-6">
			{/* Überschrift für verfügbare Verbindungen */}
			<h2 className="text-xl font-bold mb-4 text-foreground">
				Verfügbare Verbindungen
			</h2>
			<div className="space-y-4">
				{/* Iteriere über alle Verbindungen und zeige sie an */}
				{journeys.map((journey, index) => {
					const isSelected = selectedJourney === journey;
					return (
						<div
							key={index}
							className={`bg-background/60 rounded-lg p-4 transition-all duration-200 ${
								isSelected
									? "ring-2 ring-blue-500 bg-blue-500/10"
									: "hover:bg-foreground/10 cursor-pointer"
							}`}
							onClick={() => onJourneySelect && onJourneySelect(journey, index)}
						>
							{/* Zeige einzelne Verbindungskarte an */}
							<JourneyCard
								journey={journey}
								travelClass={travelClass}
								isSelected={isSelected}
							/>

							{/* Zeige Auswahl-Bestätigung für ausgewählte Verbindung */}
							{isSelected && (
								<div className="mt-3 p-3 bg-blue-500/15 rounded-lg border-l-4 border-blue-500">
									<p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
										✅ Diese Verbindung ausgewählt - Scroll nach unten für
										Split-Ticket Analyse
									</p>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};
