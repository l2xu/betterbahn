import { vendoJourneySchema, validatedVendoJourneySchema, type VendoJourney } from "@/utils/schemas";
import type { ProgressInfo, SplitPoint, TrainLine } from "@/utils/types.js";
import { createClient } from "db-vendo-client";
import { data as loyaltyCards } from "db-vendo-client/format/loyalty-cards";
import { profile as dbProfile } from "db-vendo-client/p/db/index";
import { z } from "zod/v4";
import { getApiCount, incrementApiCount } from "@/utils/apiCounter";
import { apiErrorHandler } from "../_lib/error-handler";

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
		bahnCard,
		hasDeutschlandTicket,
		passengerAge,
		travelClass,
		useStreaming,
	} = await request.json();

	// Validate originalJourney with schema
	try {
		validatedVendoJourneySchema.parse(originalJourney);
	} catch (error) {
		return Response.json({ 
			error: "Invalid originalJourney: missing required station IDs or journey structure",
			details: error instanceof z.ZodError ? error.issues : undefined
		}, { status: 400 });
	}

	// Split-Kandidaten aus vorhandenen Legs ableiten (keine zusätzlichen API Calls)
	const splitPoints = extractSplitPoints(originalJourney);

	// Falls es keine potenziellen Split-Stationen gibt:
	// - Bei Streaming (SSE) trotzdem einen Stream zurückgeben, der sofort "complete" sendet.
	// - Ansonsten als JSON antworten.
	if (splitPoints.length === 0) {
		if (useStreaming) {
			return handleStreamingResponse(
				originalJourney,
				splitPoints,
				bahnCard,
				hasDeutschlandTicket,
				passengerAge,
				travelClass
			);
		}
		return Response.json({
			success: true,
			splitOptions: [],
			message: "No split points found",
		});
	}

	// Behandle Streaming-Response, falls gewünscht
	if (useStreaming) {
		return handleStreamingResponse(
			originalJourney,
			splitPoints,
			bahnCard,
			hasDeutschlandTicket,
			passengerAge,
			travelClass
		);
	}

	// Baue die Abfrageoptionen basierend auf den übergebenen Parametern wie bahnCard, db-ticket usw.
	const queryOptions = buildQueryOptions({
		bahnCard,
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
	return await apiErrorHandler(() => handler(request));
}

interface QueryOptions {
	deutschlandTicketDiscount?: boolean;
	results: number;
	stopovers: boolean;
	firstClass: boolean;
	notOnlyFastRoutes: boolean;
	remarks: boolean;
	transfers: number;
	loyaltyCard?: {
		type: string;
		discount: number;
		class: number;
	};
	age?: number;
}

// Helper Functions
function buildQueryOptions({
	bahnCard,
	hasDeutschlandTicket,
	passengerAge,
	travelClass,
}: {
	bahnCard: string;
	hasDeutschlandTicket: boolean;
	passengerAge: unknown;
	travelClass?: string;
}) {
	const options: QueryOptions = {
		results: 1,
		stopovers: true,
		firstClass: parseInt(travelClass || "2", 10) === 1,
		notOnlyFastRoutes: true,
		remarks: true,
		transfers: 3,
	};

	const discount = parseInt(bahnCard, 10);

	if (bahnCard && bahnCard !== "none" && [25, 50, 100].includes(discount)) {
		options.loyaltyCard = {
			type: loyaltyCards.BAHNCARD,
			discount,
			class: parseInt(travelClass || "2", 10),
		};
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
	const map = new Map<string, SplitPoint>();

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
				const trainLine: TrainLine | undefined = typeof leg.line === 'object' ? {
					name: leg.line.name,
					product: leg.line.product || leg.line.productName,
				} : undefined;

				map.set(s.stop.id, {
					station: { id: s.stop.id, name: s.stop.name || '' },
					arrival: typeof s.arrival === 'string' ? s.arrival : '',
					departure: typeof s.departure === 'string' ? s.departure : '',
					trainLine,
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

		// Schema validation at entry point ensures origin/destination IDs exist

		// Make both API calls in parallel using Promise.all
		const [firstSegmentUntyped, secondSegmentUntyped] = await Promise.all([
			client.journeys(origin!.id, splitPoint.station.id, {
				...queryOptions,
				departure: originalDeparture,
			}),

			client.journeys(splitPoint.station.id, destination!.id, {
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
function handleStreamingResponse(
	originalJourney: VendoJourney,
	splitPoints: SplitPoint[],
	bahnCard: string,
	hasDeutschlandTicket: boolean,
	// Alter: vom Client kann number|null kommen
	passengerAge: number | null,
	travelClass: string
) {
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			try {
				// Build query options
				const queryOptions = buildQueryOptions({
					bahnCard,
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

				// Sonderfall: Keine Split-Stationen -> sofort "complete" senden
				if (splitPoints.length === 0) {
					const finalData = {
						type: "complete",
						success: true,
						splitOptions: [],
						originalPrice,
					};
					controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`));
					// Wichtig: Nicht hier schließen, das erledigt der finally-Block (verhindert Doppel-Schließen-Fehler)
					return;
				}

				// Normale Analyse mit Fortschritt
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
				// Stream am Ende sicher schließen (Doppel-Schließen ignorieren z.B. bei Fehlern oder Abbrüchen des Clients)
				try {
					controller.close();
				} catch {
					// noop
				}
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
