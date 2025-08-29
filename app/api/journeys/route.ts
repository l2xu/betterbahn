import { vendoJourneySchema } from "@/utils/schemas";
import { createClient, type SearchJourneysOptions } from "db-vendo-client";
import { data as loyaltyCards } from "db-vendo-client/format/loyalty-cards";
import { profile as dbProfile } from "db-vendo-client/p/db/index";
import { z } from "zod/v4";
import {
	getApiCount,
	incrementApiCount,
	resetApiCount,
} from "../../../utils/apiCounter";
import { apiErrorHandler } from "../_lib/error-handler";

const userAgent = "mail@lukasweihrauch.de";
const client = createClient(dbProfile, userAgent);

// GET-Route für Verbindungssuche
const handler = async (request: Request) => {
	// API-Zähler für neue Verbindungssuche zurücksetzen
	resetApiCount();

	// URL-Parameter extrahieren
	const { searchParams } = new URL(request.url);
	const from = searchParams.get("from");
	const to = searchParams.get("to");
	const departure = searchParams.get("departure");
	const results = searchParams.get("results") || "10";
	const discount = searchParams.get("discount");
	const hasDeutschlandTicket =
		searchParams.get("hasDeutschlandTicket") === "true";
	const passengerAge = searchParams.get("passengerAge");
	const travelClass = searchParams.get("travelClass") || "2";

	// Überprüfe ob Start- und Zielstation angegeben sind
	if (!from || !to) {
		return Response.json(
			{ error: "Missing required parameters: from and to station IDs" },
			{ status: 400 }
		);
	}

	// Validiere dass Abfahrtszeit nicht in der Vergangenheit liegt
	if (departure) {
		const departureDate = new Date(departure);
		const now = new Date();

		if (departureDate < now) {
			return Response.json(
				{ error: "Departure time cannot be in the past" },
				{ status: 400 }
			);
		}
	}

	// Suchoptionen konfigurieren
	const options: SearchJourneysOptions = {
		results: departure ? 5 : parseInt(results), // Weniger Ergebnisse bei genauer Zeit um Rauschen zu reduzieren
		stopovers: true,
		// Bei genauer Abfahrtszeit wollen wir exakte Treffer, nicht verschiedene Alternativen
		notOnlyFastRoutes: departure ? false : true, // Nur schnelle Routen bei genauer Zeit
		remarks: true, // Verbindungshinweise einschließen
		transfers: -1, // System entscheidet über optimale Anzahl Umstiege
		// Reiseklasse-Präferenz setzen - verwende firstClass boolean Parameter
		firstClass: parseInt(travelClass) === 1, // true für erste Klasse, false für zweite Klasse
	};

	// Abfahrtszeit hinzufügen falls angegeben
	if (departure) {
		options.departure = new Date(departure);
	}

	// Add discount card if specified
	if (discount && discount !== "none") {
		const discountValue = parseInt(discount);
		if ([25, 50, 100].includes(discountValue)) {
			options.loyaltyCard = {
				type: loyaltyCards.BAHNCARD,
				discount: discountValue,
				class: parseInt(travelClass), // 1 für erste Klasse, 2 für zweite Klasse
			};
		}
	}

	// Passagieralter für angemessene Preisgestaltung hinzufügen
	if (passengerAge && !isNaN(parseInt(passengerAge))) {
		options.age = parseInt(passengerAge);
	}

	// Deutschland-Ticket Optionen für genauere Preisgestaltung
	if (hasDeutschlandTicket) {
		options.deutschlandTicketDiscount = true;
		// Diese Option kann helfen, genauere Preise zurückzugeben wenn Deutschland-Ticket verfügbar ist
		options.deutschlandTicketConnectionsOnly = false; // Wir wollen alle Verbindungen, aber mit genauen Preisen
	}

	console.log("API options being passed to db-vendo-client:", options);
	console.log("Travel class requested:", travelClass);
	console.log("Discount card with class:", options.loyaltyCard);

	// API-Zähler für Verbindungssuche erhöhen
	incrementApiCount(
		"JOURNEY_SEARCH",
		`Searching journeys from ${from} to ${to}`
	);

	// Verbindungen von DB-API abrufen
	const journeys = await client.journeys(from, to, options);
	const parsed = z
		.object({ journeys: z.array(vendoJourneySchema) })
		.parse(journeys);
	let allJourneys = parsed.journeys || [];

	console.log(`Received ${allJourneys.length} journeys from main query`);

	// Filter journeys to only show exact matches for the search parameters
	if (departure && allJourneys.length > 0) {
		const targetDepartureTime = new Date(departure);
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
			const startStationMatches = firstLeg.origin?.id === from;

			// Check if end station matches
			const endStationMatches = lastLeg.destination?.id === to;

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

	if (hasDeutschlandTicket) {
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
	return apiErrorHandler(() => handler(request));
}
