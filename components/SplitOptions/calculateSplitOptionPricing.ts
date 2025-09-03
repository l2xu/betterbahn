import type { VendoJourney } from "@/utils/schemas";
import {
	legIsFlixTrain,
	isLegCoveredByDeutschlandTicket,
} from "@/utils/deutschlandTicketUtils";
import { getJourneyLegsWithTransfers } from "@/utils/journeyUtils";
import type { SplitOption } from "@/utils/types";

/** Berechne Split-Option Preisgestaltung mit Deutschland-Ticket Logik */
export const calculateSplitOptionPricing = ({
	splitOption,
	hasDeutschlandTicket,
	originalJourney,
}: {
	splitOption: SplitOption;
	hasDeutschlandTicket: boolean;
	originalJourney: VendoJourney;
}) => {
	if (!splitOption || !splitOption.segments) {
		return {
			...splitOption,
			isFullyCovered: false,
			hasRegionalTrains: false,
			cannotShowPrice: false,
			hasPartialPricing: false,
			segmentsWithoutPricing: [] as number[],
			adjustedTotalPrice: splitOption?.totalPrice || 0,
			adjustedSavings: splitOption?.savings || 0,
			hasFlixTrains: null
		};
	}

	// Überprüfe ob Split-Option Regionalzüge enthält
	const hasRegionalTrains = splitOption.segments.some((segment) => {
		const trainLegs = getJourneyLegsWithTransfers(segment);
		return trainLegs.some((leg) => {
			const product = leg.line?.product?.toLowerCase() || "";
			const regionalProducts = [
				"regional",
				"regionalbahn",
				"regionalexpress",
				"sbahn",
				"suburban",
			];
			return regionalProducts.includes(product);
		});
	});

	const hasFlixTrains = splitOption.segments.some((segment) => {
		const trainLegs = getJourneyLegsWithTransfers(segment);
		return trainLegs.some((leg) => legIsFlixTrain(leg));
	});

	let cannotShowPrice: boolean;
	let hasPartialPricing: boolean;
	let segmentsWithoutPricing: number[] = [];
	let allSegmentsCovered: boolean;

	allSegmentsCovered = splitOption.segments.every((segment) => {
		const trainLegs = getJourneyLegsWithTransfers(segment);
		return trainLegs.every((leg) =>
			isLegCoveredByDeutschlandTicket(leg, hasDeutschlandTicket)
		);
	});

	if (hasDeutschlandTicket) {
		cannotShowPrice = false;
		hasPartialPricing = false;
	} else {
		let segmentsWithPrice = 0;
		let totalSegments = splitOption.segments.length;

		splitOption.segments.forEach((segment, index) => {
			const hasPrice = segment.price && segment.price.amount != null;
			const segmentHasFlixTrain = getJourneyLegsWithTransfers(segment).some(
				(leg) => legIsFlixTrain(leg)
			);

			// Consider a segment as having no pricing if:
			// 1. It has no price data, OR
			// 2. It contains FlixTrain services (which we can't price)
			if (!hasPrice || segmentHasFlixTrain) {
				segmentsWithoutPricing.push(index);
			} else {
				segmentsWithPrice++;
			}
		});

		cannotShowPrice = segmentsWithPrice === 0;
		hasPartialPricing =
			segmentsWithPrice > 0 && segmentsWithPrice < totalSegments;
	}

	let adjustedTotalPrice = splitOption.totalPrice || 0;
	let adjustedSavings = splitOption.savings || 0;

	if (originalJourney) {
		// The API already returns prices with BahnCard discounts applied
		const originalJourneyApiPrice = originalJourney.price?.amount || 0;

		if (hasDeutschlandTicket) {
			let totalUncoveredPrice = 0;

			for (const segment of splitOption.segments) {
				const trainLegs = getJourneyLegsWithTransfers(segment);
				const segmentCovered = trainLegs.every((leg) =>
					isLegCoveredByDeutschlandTicket(leg, hasDeutschlandTicket)
				);
				const segmentPrice = segment.price?.amount || 0;

				if (!segmentCovered && segmentPrice > 0) {
					totalUncoveredPrice += segmentPrice;
				}
			}

			adjustedTotalPrice = totalUncoveredPrice;
		} else if (hasPartialPricing) {
			// For partial pricing, only sum up segments with available pricing
			let partialTotalPrice = 0;

			splitOption.segments.forEach((segment, index) => {
				if (!segmentsWithoutPricing.includes(index)) {
					partialTotalPrice += segment.price?.amount || 0;
				}
			});

			adjustedTotalPrice = partialTotalPrice;
		}

		adjustedSavings = Math.max(0, originalJourneyApiPrice - adjustedTotalPrice);
	}

	return {
		...splitOption,
		isFullyCovered: allSegmentsCovered && hasDeutschlandTicket,
		hasRegionalTrains,
		hasFlixTrains,
		cannotShowPrice,
		hasPartialPricing,
		segmentsWithoutPricing,
		adjustedTotalPrice,
		adjustedSavings,
	};
};
