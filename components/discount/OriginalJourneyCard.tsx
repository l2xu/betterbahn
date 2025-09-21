import { isLegCoveredByDeutschlandTicket } from "@/utils/deutschlandTicketUtils";
import {
	formatPriceWithTwoDecimals,
	formatTime,
	formatDuration,
	getChangesCount,
} from "@/utils/formatUtils";
import type { ExtractedData } from "@/utils/types";
import type { VendoJourney } from "@/utils/schemas";
import { JourneyIcon } from "./JourneyIcon";
import { JourneyInfoRow } from "./JourneyInfoRow";

interface OriginalJourneyCardProps {
	extractedData: ExtractedData;
	selectedJourney: VendoJourney;
}

export function OriginalJourneyCard({
	extractedData,
	selectedJourney,
}: OriginalJourneyCardProps) {
	if (!extractedData) return null;

	const { hasDeutschlandTicket } = extractedData;
	const trainLegs = selectedJourney.legs?.filter((leg) => !leg.walking) || [];
	const isFullyCoveredByDticket =
		hasDeutschlandTicket &&
		trainLegs.length > 0 &&
		trainLegs.every((leg) =>
			isLegCoveredByDeutschlandTicket(leg, hasDeutschlandTicket)
		);

	const formattedPrice = formatPriceWithTwoDecimals(selectedJourney.price);
	let priceDisplay;

	if (formattedPrice !== null) {
		priceDisplay = formattedPrice;
	} else if (isFullyCoveredByDticket) {
		priceDisplay = "0,00€";
	} else {
		priceDisplay = "Preis auf Anfrage";
	}

	const renderSelectedJourney = () => (
		<div className="border rounded-lg overflow-hidden shadow-sm bg-card-bg border-card-border">
			<div className="p-4">
				<div className="flex items-start">
					<JourneyIcon />
					<div className="flex-grow">
						{/* Departure */}
						<div className="flex justify-between items-start">
							<div>
								<span className="font-bold text-xl ">
									{selectedJourney.legs?.[0]
										? formatTime(selectedJourney.legs[0].departure)
										: extractedData.time || ""}
								</span>
								<span className="ml-3 text-lg ">
									{extractedData.fromStation}
								</span>
							</div>
							<div className="text-right">
								<div className="font-bold text-lg text-red-600">Original</div>
								<div className="text-xl font-bold ">{priceDisplay}</div>
							</div>
						</div>

						{/* Journey details */}
						<JourneyInfoRow>
							<span>
								{formatDuration(selectedJourney) || "Dauer unbekannt"}
							</span>
							<span className="">·</span>
							<span>
								{getChangesCount(selectedJourney)} Zwischenstopp
								{getChangesCount(selectedJourney) === 1 ? "" : "s"}
							</span>
							<span className="ml-2 inline-block px-1.5 py-0.5 text-xs font-semibold text-red-700 border border-red-400 rounded-sm">
								DB
							</span>
						</JourneyInfoRow>

						{/* Arrival */}
						<div className="flex justify-between items-start mt-2">
							<div>
								<span className="font-bold text-xl">
									{selectedJourney.legs?.[selectedJourney.legs.length - 1]
										? formatTime(
												selectedJourney.legs[selectedJourney.legs.length - 1]
													.arrival
										  )
										: ""}
								</span>
								<span className="ml-3 text-lg ">{extractedData.toStation}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Additional details */}
				<div className="mt-4 pt-4 border-t border-card-border">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p className="">Klasse</p>
							<p className="">{extractedData.travelClass || "2"}. Klasse</p>
						</div>
						<div>
							<p className="">BahnCard</p>
							<p className="">
								{extractedData.bahnCard === "none"
									? "Keine"
									: `BahnCard ${extractedData.bahnCard}`}
							</p>
						</div>
					</div>

					{extractedData.hasDeutschlandTicket && (
						<div className="mt-2">
							<p className=" text-sm">Deutschland-Ticket</p>
							<p className="text-green-600 font-medium">✓ Vorhanden</p>
						</div>
					)}

					{selectedJourney.price?.hint && (
						<div className="mt-2">
							<p className="text-xs ">{selectedJourney.price.hint}</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);

	return (
		<div className="space-y-6">
			<h3 className="font-semibold text-lg ">Deine Verbindung</h3>
			{selectedJourney ? (
				renderSelectedJourney()
			) : (
				<div className="text-center py-4">Deine Verbindung wird geladen...</div>
			)}
		</div>
	);
}
