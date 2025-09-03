import type { VendoJourney } from "@/utils/schemas";
import { createSegmentSearchUrl } from "@/utils/createUrl";
import {
	legIsFlixTrain,
	isLegCoveredByDeutschlandTicket,
} from "@/utils/deutschlandTicketUtils";
import {
	getJourneyLegsWithTransfers,
	getLineInfoFromLeg,
	getStationName,
} from "@/utils/journeyUtils";
import { formatTime } from "@/utils/formatUtils";
import { formatPriceDE } from "@/utils/priceUtils";

export const Segment = ({
	segment,
	index,
	segmentsWithoutPricing,
	hasDeutschlandTicket,
}: {
	segment: VendoJourney;
	index: number;
	segmentsWithoutPricing: number[];
	hasDeutschlandTicket: boolean;
}) => {
	const segmentHasFlixTrain = getJourneyLegsWithTransfers(segment).some((leg) =>
		legIsFlixTrain(leg)
	);
	const hasUnknownPrice = segmentsWithoutPricing?.includes(index);

	// Check if segment is covered by Deutschland-Ticket
	const segmentCoveredByDeutschlandTicket =
		hasDeutschlandTicket &&
		getJourneyLegsWithTransfers(segment).every((leg) =>
			isLegCoveredByDeutschlandTicket(leg, hasDeutschlandTicket)
		);

	return (
		<div className="flex justify-between items-center p-2 rounded-md bg-background border border-foreground/20">
			<div className="flex-grow">
				<div className="font-semibold text-sm text-foreground flex items-center gap-2">
					{getJourneyLegsWithTransfers(segment).map((leg, legIndex) => (
						<span key={legIndex} className="flex items-center gap-1">
							{getLineInfoFromLeg(leg)}
							{legIndex < getJourneyLegsWithTransfers(segment).length - 1 && (
								<span className="text-foreground/50">→</span>
							)}
						</span>
					))}
				</div>
				<div className="text-xs text-foreground/60 mt-1">
					{getStationName(segment.legs[0].origin)} (
					{formatTime(segment.legs[0].departure)}) →{" "}
					{getStationName(segment.legs[segment.legs.length - 1].destination)} (
					{formatTime(segment.legs[segment.legs.length - 1].arrival)})
				</div>
			</div>
			<div className="text-right ml-4 flex-shrink-0 w-28">
				<div className="font-bold text-md">
					{segmentCoveredByDeutschlandTicket ? (
						<span className="text-xs font-medium text-green-600">
							✓ D-Ticket
						</span>
					) : hasUnknownPrice ? (
						<span
							className={`text-xs font-medium ${
								segmentHasFlixTrain ? "text-purple-600" : "text-orange-600"
							}`}
						>
							{segmentHasFlixTrain ? "FlixTrain" : "Price unknown"}
						</span>
					) : (
						<span>
							{segment.price?.amount !== undefined
								? formatPriceDE(segment.price.amount)
								: "Price on request"}
						</span>
					)}
				</div>
				<button
					onClick={(e) => {
						e.stopPropagation();

						const dbUrl = createSegmentSearchUrl(segment, 2);

						if (dbUrl && !dbUrl.startsWith("Error:")) {
							window.open(dbUrl, "_blank");
						} else {
							console.error("Failed to generate URL:", dbUrl);
							alert("Failed to generate booking URL.");
						}
					}}
					className="mt-1 px-3 py-1 bg-green-600 text-foreground text-xs rounded-md "
				>
					Zur Buchung
				</button>
			</div>
		</div>
	);
};
