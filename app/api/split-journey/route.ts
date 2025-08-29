import { vendoJourneySchema, type VendoJourney } from "@/utils/schemas";
import type { ProgressInfo, SplitPoint, TrainLine } from "@/utils/types.js";
import { createClient } from "db-vendo-client";
import { data as loyaltyCards } from "db-vendo-client/format/loyalty-cards";
import { profile as dbProfile } from "db-vendo-client/p/db/index";
import { z } from "zod/v4";
import { getApiCount, incrementApiCount } from "../../../utils/apiCounter";
import { apiErrorHandler } from "../_lib/error-handler";

/**
 * Maps BetterBahn discount values to db-vendo-client loyalty card format
 */
function mapDiscountToLoyaltyCard(discountType: string, travelClass: number) {
	switch (discountType) {
		// German BahnCards
		case "25":
			return { type: loyaltyCards.BAHNCARD, discount: 25, class: travelClass };
		case "50": 
			return { type: loyaltyCards.BAHNCARD, discount: 50, class: travelClass };
		case "business25":
			return { type: loyaltyCards.BAHNCARD, discount: 25, business: true, class: travelClass };
		case "business50":
			return { type: loyaltyCards.BAHNCARD, discount: 50, business: true, class: travelClass };
		
		// International discounts
		case "ch-general":
			return { type: loyaltyCards.GENERALABONNEMENT, class: travelClass };
		case "ch-halbtax":
			return { type: loyaltyCards.HALBTAXABO };
		case "at-vorteil":
			return { type: loyaltyCards.VORTEILSCARD };
		case "nl-40":
			return { type: loyaltyCards.NL_40 };
		case "klimaticket":
			return { type: loyaltyCards.AT_KLIMATICKET, class: travelClass };
		
		default:
			return null;
	}
}

const client = createClient(dbProfile, "mail@lukasweihrauch.de");

const MIN_SINGLE_SAVINGS_FACTOR = 1; // Preis muss < original * 0.98 sein
const TIME_TOLERANCE_MS = 60_000; // 1 Minute Toleranz
const DEFAULT_BATCH_SIZE = 1; // Konservativ für Rate-Limits
const VERBOSE = true; // Ausführliche Logs ein/ausschalten

// POST-Route für Split-Journey Analyse
const handler = async (request: Request) => {
	// Übergebene Daten aus der Anfrage extrahieren
	const {
		originalJourney,
		discount,
		hasDeutschlandTicket,
		passengerAge,
		travelClass,
		useStreaming,
	} = await request.json();

	// Validiere dass originalJourney vorhanden ist
	if (!originalJourney?.legs) {
		return Response.json({ error: "Missing originalJourney" }, { status: 400 });
	}

	// Split-Kandidaten aus vorhandenen Legs ableiten (keine zusätzlichen API Calls)
	const splitPoints = extractSplitPoints(originalJourney);

	if (splitPoints.length === 0) {
		return Response.json({
			success: true,
			splitOptions: [],
			message: "No split points found",
		});
	}

	// Behandle Streaming-Response falls gewünscht
	if (useStreaming) {
		return handleStreamingResponse(
			originalJourney,
			splitPoints,
			discount,
			hasDeutschlandTicket,
			passengerAge,
			travelClass
		);
	}

	// Baue die Abfrageoptionen basierend auf den übergebenen Parametern wie Ermäßigungen, db-ticket usw.
	const queryOptions = buildQueryOptions({
		discount,
		hasDeutschlandTicket,
		passengerAge,
		travelClass,
	});

	// Speichert den Originalpreis der Reise, um ihn später für die Einsparungsberechnung zu verwenden
	const originalPrice = originalJourney.price?.amount || 0;

	const splitOptions = await analyzeSplitPoints(
		originalJourney,
		splitPoints,
		queryOptions,
		originalPrice
	);

	console.log(
		`\n✅ SPLIT ANALYSIS COMPLETED - Total API calls: ${getApiCount()}\n`
	);

	// Gibt die Ergebnisse als JSON zurück
	return Response.json({
		success: true,
		splitOptions: splitOptions.sort((a, b) => b.savings - a.savings),
		originalPrice,
	});
};

export async function POST(request: Request) {
	return apiErrorHandler(() => handler(request));
}

interface QueryOptions {
	deutschlandTicketDiscount?: boolean;
	results: number;
	stopovers: boolean;
	firstClass: boolean;
	loyaltyCard?: {
		type: string;
		discount: number;
		class: number;
	};
	age?: number;
}

// Helper Functions
function buildQueryOptions({
	discount,
	hasDeutschlandTicket,
	passengerAge,
	travelClass,
}: {
	discount: string | string[];
	hasDeutschlandTicket: boolean;
	passengerAge: unknown;
	travelClass?: string;
}) {
	const options: QueryOptions = {
		results: 1,
		stopovers: true,
		firstClass: parseInt(travelClass || "2", 10) === 1,
	};
	if (discount && discount !== "none") {
		const discountArray = Array.isArray(discount) ? discount : [discount];
		const loyaltyCardConfig = mapDiscountToLoyaltyCard(discountArray[0], parseInt(travelClass || "2", 10));
		if (loyaltyCardConfig) {
			options.loyaltyCard = loyaltyCardConfig;
		}
	}

	if (typeof passengerAge === "number") {
		options.age = passengerAge;
	}

	if (hasDeutschlandTicket) {
		options.deutschlandTicketDiscount = true;
	}

	return options;
}

function extractSplitPoints(journey: VendoJourney) {
	const map = new Map();

	journey.legs.forEach((leg, legIndex) => {
		if (leg.walking || !leg.stopovers) {
			return;
		}

		leg.stopovers.forEach((s, stopIndex) => {
			if (
				(legIndex === 0 && stopIndex === 0) ||
				(legIndex === journey.legs.length - 1 &&
					stopIndex === leg.stopovers!.length - 1)
			) {
				return;
			}

			if (s.arrival && s.departure && s.stop && !map.has(s.stop.id)) {
				map.set(s.stop.id, {
					station: { id: s.stop.id, name: s.stop.name },
					arrival: s.arrival,
					departure: s.departure,
					trainLine: leg.line,
					loadFactor: s.loadFactor,
					legIndex,
					stopIndex,
				});
			}
		});
	});

	const uniqueStops = Array.from(map.values());

	if (VERBOSE) {
		console.log(`Extracted ${uniqueStops.length} unique split candidates.`);
	}

	return uniqueStops;
}

async function analyzeSplitPoints(
	originalJourney: VendoJourney,
	splitPoints: SplitPoint[],
	queryOptions: QueryOptions,
	originalPrice: number,
	{
		onProgress,
		batchSize = DEFAULT_BATCH_SIZE,
	}: { onProgress?: unknown; batchSize?: number } = {}
) {
	const splitOptions = [];
	const streaming = typeof onProgress === "function";
	if (VERBOSE)
		console.log(
			`\n🔍 Analyse von ${splitPoints.length} Split-Stationen gestartet (streaming=${streaming})`
		);

	const processBatch = async (points: SplitPoint[]) => {
		const results = await Promise.allSettled(
			points.map((sp) =>
				analyzeSingleSplit(originalJourney, sp, queryOptions, originalPrice)
			)
		);
		results.forEach((res, idx) => {
			const sp = points[idx];
			if (
				res.status === "fulfilled" &&
				res.value &&
				res.value.totalPrice < originalPrice * MIN_SINGLE_SAVINGS_FACTOR
			) {
				splitOptions.push(res.value);
				if (VERBOSE)
					console.log(
						`✅ ${sp.station?.name}: €${res.value.totalPrice} (saves €${res.value.savings})`
					);
			} else if (res.status === "rejected" && VERBOSE) {
				console.log(`❌ ${sp.station?.name}:`, res.reason?.message || "error");
			}
		});
	};

	if (streaming) {
		for (let i = 0; i < splitPoints.length; i++) {
			const sp = splitPoints[i];
			onProgress({
				checked: i,
				total: splitPoints.length,
				message: `Prüfe ${sp.station?.name}...`,
				currentStation: sp.station?.name,
			});
			try {
				const option = await analyzeSingleSplit(
					originalJourney,
					sp,
					queryOptions,
					originalPrice
				);
				if (
					option &&
					option.totalPrice < originalPrice * MIN_SINGLE_SAVINGS_FACTOR
				)
					splitOptions.push(option);
			} catch {
				/* logged */
			}
			onProgress({
				checked: i + 1,
				total: splitPoints.length,
				message:
					i + 1 === splitPoints.length
						? "Analyse abgeschlossen"
						: `${i + 1}/${splitPoints.length} Stationen geprüft`,
				currentStation: sp.station?.name,
			});
			if (i < splitPoints.length - 1)
				await new Promise((r) => setTimeout(r, 100));
		}
	} else {
		for (let i = 0; i < splitPoints.length; i += batchSize) {
			await processBatch(splitPoints.slice(i, i + batchSize));
			if (i + batchSize < splitPoints.length)
				await new Promise((r) => setTimeout(r, 100));
		}
	}
	return splitOptions;
}

// Split Analysis Functions
async function analyzeSingleSplit(
	originalJourney: VendoJourney,
	splitPoint: SplitPoint,
	queryOptions: QueryOptions,
	originalPrice: number
) {
	const origin = originalJourney.legs[0].origin;
	const destination =
		originalJourney.legs[originalJourney.legs.length - 1].destination;
	const originalDeparture = new Date(originalJourney.legs[0].departure);
	const splitDeparture = new Date(splitPoint.departure);

	try {
		// Increment API counters for both segments
		incrementApiCount(
			"SPLIT_SEARCH_SEGMENT_1",
			`${origin?.name} → ${splitPoint.station?.name}`
		);
		incrementApiCount(
			"SPLIT_SEARCH_SEGMENT_2",
			`${splitPoint.station?.name} → ${destination?.name}`
		);

		// Make both API calls in parallel using Promise.all
		const [firstSegmentUntyped, secondSegmentUntyped] = await Promise.all([
			/** TODO origin and destination can be undefined, there's probably a check (type-gate) with error handling missing here */
			client.journeys(origin?.id, splitPoint.station.id, {
				...queryOptions,
				departure: originalDeparture,
			}),

			client.journeys(splitPoint.station.id, destination?.id, {
				...queryOptions,
				departure: splitDeparture,
			}),
		]);

		const clientJourneySchema = z.object({
			journeys: z.array(vendoJourneySchema),
		});
		const firstSegment = clientJourneySchema.parse(firstSegmentUntyped);
		const secondSegment = clientJourneySchema.parse(secondSegmentUntyped);

		if (
			firstSegment.journeys === undefined ||
			secondSegment.journeys === undefined
		) {
			return null;
		}

		const firstJourney = findMatchingJourney(
			firstSegment.journeys,
			originalDeparture
		);

		if (!firstJourney) {
			return null;
		}

		const secondJourney = findMatchingJourney(
			secondSegment.journeys,
			splitDeparture
		);

		if (!secondJourney) {
			return null;
		}

		// Calculate pricing
		const firstPrice = firstJourney.price?.amount || 0;
		const secondPrice = secondJourney.price?.amount || 0;
		const totalPrice = firstPrice + secondPrice;

		if (totalPrice > 0 && totalPrice < originalPrice) {
			return createSplitResult(
				"single",
				[splitPoint.station],
				[firstJourney, secondJourney],
				totalPrice,
				originalPrice,
				splitPoint.trainLine
			);
		}

		return null;
	} catch (error) {
		const typedError = error as { message: string };
		console.log(
			`Single split analysis error at ${splitPoint.station.name}:`,
			typedError.message
		);
		throw error; // Re-throw to be handled by Promise.allSettled
	}
}

function createSplitResult(
	type: string,
	splitStations: unknown,
	segments: VendoJourney[],
	totalPrice: number,
	originalPrice: number,
	trainLine?: TrainLine
) {
	const savings = originalPrice - totalPrice;

	return {
		type: `same-train-${type}-split`,
		splitStations,
		segments,
		totalPrice,
		originalPrice,
		savings,
		savingsPercentage: ((savings / originalPrice) * 100).toFixed(1),
		trainInfo: {
			line: trainLine?.name || "Unknown",
			product: trainLine?.product || "Unknown",
		},
	};
}

function findMatchingJourney(
	journeys: readonly VendoJourney[],
	targetDeparture: Date
) {
	if (!journeys?.length) return null;
	const expected = targetDeparture.getTime();
	return (
		journeys.find(
			(j) =>
				Math.abs(new Date(j.legs[0].departure).getTime() - expected) <=
				TIME_TOLERANCE_MS
		) || null
	);
}

// Streaming handler for real-time progress updates
async function handleStreamingResponse(
	originalJourney: VendoJourney,
	splitPoints: SplitPoint[],
	discount: string | string[],
	hasDeutschlandTicket: boolean,
	passengerAge: string,
	travelClass: string
) {
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			try {
				// Build query options
				const queryOptions = buildQueryOptions({
					discount,
					hasDeutschlandTicket,
					passengerAge,
					travelClass,
				});

				const originalPrice = originalJourney.price?.amount || 0;

				// Send initial progress
				const initialData = {
					type: "progress",
					checked: 0,
					total: splitPoints.length,
					message: "Analyse gestartet...",
				};
				controller.enqueue(
					encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`)
				);

				// Find split options with progress updates
				const splitOptions = await analyzeSplitPoints(
					originalJourney,
					splitPoints,
					queryOptions,
					originalPrice,
					{
						onProgress: (progress: ProgressInfo) => {
							controller.enqueue(
								encoder.encode(
									`data: ${JSON.stringify({
										type: "progress",
										checked: progress.checked,
										total: progress.total,
										message: progress.message,
										currentStation: progress.currentStation,
									})}\n\n`
								)
							);
						},
						batchSize: 1,
					}
				);

				// Send final result
				const finalData = {
					type: "complete",
					success: true,
					splitOptions: splitOptions.sort((a, b) => b.savings - a.savings),
					originalPrice,
				};
				controller.enqueue(
					encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`)
				);
			} catch (error) {
				const typedError = error as { message?: string };

				const errorData = {
					type: "error",
					error: typedError.message || "Failed to analyze split journeys",
				};
				controller.enqueue(
					encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`)
				);
			} finally {
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
}
