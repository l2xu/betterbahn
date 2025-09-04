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

	// Generate booking URL during render with error handling
	let bookingUrl: string | null = null;
	try {
		const dbUrl = createSegmentSearchUrl(segment, 2);
		if (dbUrl && !dbUrl.startsWith("Error:")) {
			bookingUrl = dbUrl;
		}
	} catch (error) {
		console.error("Failed to generate booking URL:", error);
	}

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
							className={`text-xs font-medium ${segmentHasFlixTrain ? "text-purple-600" : "text-orange-600"
								}`}
						>
							{segmentHasFlixTrain ? "FlixTrain" : "Price unknown"}
						</span>
					) : (
						<span>
							{segment.price?.amount === undefined
								? "Price on request"
								: formatPriceDE(segment.price.amount)}
						</span>
					)}
				</div>
				{bookingUrl ? (
					<a
						href={bookingUrl}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => {
							e.stopPropagation();
						}}
						className="mt-1 px-3 py-1 bg-green-600 text-foreground text-xs rounded-md inline-block text-center no-underline hover:bg-green-700 transition-colors"
					>
						Zur Buchung
					</a>
				) : (
					<button
						disabled
						className="mt-1 px-3 py-1 bg-gray-400 text-foreground text-xs rounded-md cursor-not-allowed"
						title="Booking URL could not be generated"
					>
						Zur Buchung
					</button>
				)}
			</div>
		</div>
	);
};
