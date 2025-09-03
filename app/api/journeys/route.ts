import { vendoJourneySchema } from "@/utils/schemas";
import { createClient } from "db-vendo-client";
import { profile as dbProfile } from "db-vendo-client/p/db/index";
import { z } from "zod/v4";
import {
	getApiCount,
	incrementApiCount,
	resetApiCount,
} from "@/utils/apiCounter";
import { apiErrorHandler } from "../_lib/error-handler";
import { configureSearchOptions } from "./_lib/configure-search-options";
import { extractUrlParams } from "./_lib/extract-url-params";

const userAgent = "mail@lukasweihrauch.de";
const client = createClient(dbProfile, userAgent);

// GET-Route für Verbindungssuche
const handler = async (request: Request) => {
	// API-Zähler für neue Verbindungssuche zurücksetzen
	resetApiCount();

	const urlParams = extractUrlParams(request.url);

	// Überprüfe ob Start- und Zielstation angegeben sind
	if (!urlParams.from || !urlParams.to) {
		return Response.json(
			{ error: "Missing required parameters: from and to station IDs" },
			{ status: 400 }
		);
	}

	// Validiere, dass Abfahrtszeit nicht in der Vergangenheit liegt
	if (urlParams.departure) {
		const departureDate = new Date(urlParams.departure);
		const now = new Date();

		if (departureDate < now) {
			return Response.json(
				{ error: "Departure time cannot be in the past" },
				{ status: 400 }
			);
		}
	}

	const options = configureSearchOptions(urlParams);

	// API-Zähler für Verbindungssuche erhöhen
	incrementApiCount(
		"JOURNEY_SEARCH",
		`Searching journeys from ${urlParams.from} to ${urlParams.to}`
	);

	// Verbindungen von DB-API abrufen
	const journeys = await client.journeys(urlParams.from, urlParams.to, options);

	const parsed = z
		.object({ journeys: z.array(vendoJourneySchema) })
		.parse(journeys);

	let allJourneys = parsed.journeys;

	console.log(`Received ${allJourneys.length} journeys from main query`);

	// Filter journeys to only show exact matches for the search parameters
	if (urlParams.departure && allJourneys.length > 0) {
		const targetDepartureTime = new Date(urlParams.departure);
		console.log(
			`Filtering for exact matches to departure time: ${targetDepartureTime.toISOString()}`
		);

		// Filter journeys that exactly match the search criteria
		const exactMatches = allJourneys.filter((journey) => {
			if (journey.legs.length === 0) {
				return false;
			}

			const firstLeg = journey.legs[0];
			const lastLeg = journey.legs.at(-1)!;

			// Check if start station matches
			const startStationMatches = firstLeg.origin?.id === urlParams.from;

			// Check if end station matches
			const endStationMatches = lastLeg.destination?.id === urlParams.to;

			// Check if departure time matches (within 1 minute tolerance for exact time matching)
			const journeyDeparture = new Date(firstLeg.departure);
			const timeDifference = Math.abs(
				journeyDeparture.getTime() - targetDepartureTime.getTime()
			);

			const timeMatches = timeDifference <= 60000; // 1 minute tolerance

			return startStationMatches && endStationMatches && timeMatches;
		});

		console.log(
			`Found ${exactMatches.length} exact matches out of ${allJourneys.length} total journeys`
		);

		if (exactMatches.length > 0) {
			// Remove duplicates based on journey signature, but keep different ticket types/prices
			const uniqueExactMatches = exactMatches.filter((journey, index, arr) => {
				const journeySignature = journey.legs
					.map(
						(leg) =>
							`${leg.line?.name || "walk"}-${leg.origin?.id}-${
								leg.destination?.id
							}-${leg.departure}`
					)
					.join("|");

				const key = `${journeySignature}-${
					journey.price?.amount || "no-price"
				}`;
				return (
					arr.findIndex((j) => {
						const jSignature = j.legs
							.map(
								(leg) =>
									`${leg.line?.name || "walk"}-${leg.origin?.id}-${
										leg.destination?.id
									}-${leg.departure}`
							)
							.join("|");
						const jKey = `${jSignature}-${j.price?.amount || "no-price"}`;
						return jKey === key;
					}) === index
				);
			});

			// Sort by price if multiple options for the same journey
			uniqueExactMatches.sort((a, b) => {
				const priceA = a.price?.amount || 0;
				const priceB = b.price?.amount || 0;
				return priceA - priceB;
			});

			allJourneys = uniqueExactMatches;
			console.log(`Using ${allJourneys.length} unique exact matches`);
		} else {
			console.log("No exact matches found, keeping all journeys as fallback");
		}
	} else {
		// If no specific departure time is provided, remove general duplicates
		const uniqueJourneys = allJourneys.filter((journey, index, arr) => {
			if (journey.legs.length === 0) return false;

			const journeySignature = journey.legs
				.map(
					(leg) =>
						`${leg.line?.name || "walk"}-${leg.origin?.id}-${
							leg.destination?.id
						}-${leg.departure}`
				)
				.join("|");

			const key = `${journeySignature}-${journey.price?.amount || "no-price"}`;
			return (
				arr.findIndex((j) => {
					if (!j.legs || j.legs.length === 0) return false;
					const jSignature = j.legs
						.map(
							(leg) =>
								`${leg.line?.name || "walk"}-${leg.origin?.id}-${
									leg.destination?.id
								}-${leg.departure}`
						)
						.join("|");
					const jKey = `${jSignature}-${j.price?.amount || "no-price"}`;
					return jKey === key;
				}) === index
			);
		});

		// Sort by departure time
		uniqueJourneys.sort(
			(a, b) =>
				new Date(a.legs[0].departure).getTime() -
				new Date(b.legs[0].departure).getTime()
		);

		allJourneys = uniqueJourneys;
		console.log(`Total unique journeys: ${allJourneys.length}`);
	}

	if (urlParams.hasDeutschlandTicket) {
		console.log(
			"Deutschland-Ticket enabled - all journeys should be visible with accurate pricing"
		);
	}

	console.log(
		`\n✅ JOURNEY SEARCH COMPLETED - Total API calls: ${getApiCount()}\n`
	);

	return Response.json({
		success: true,
		journeys: allJourneys,
	});
};

export async function GET(request: Request) {
	return await apiErrorHandler(() => handler(request));
}
