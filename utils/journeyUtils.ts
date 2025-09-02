import type { ExtractedData } from "./types";
import type {
	VendoJourney,
	VendoLeg,
	VendoOriginOrDestination,
} from "@/utils/schemas";

// Formatiere Zeit von ISO-String zu HH:MM
export const formatTime = (dateString: string) => {
	const date = new Date(dateString);

	if (isNaN(date.getTime())) {
		console.error("Invalid date string:", dateString);
		return "Invalid time";
	}

	try {
		return date.toLocaleTimeString("de-DE", {
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return "Invalid time"; // Fallback bei unwahrscheinlichem Locale-Fehler
	}
};

// Berechne und formatiere Reisedauer
export const formatDuration = (journey: { legs: VendoLeg[] }) => {
	const legs = journey?.legs;
	if (!legs?.length) return "Unknown duration";
	const firstLeg = legs[0];
	const lastLeg = legs[legs.length - 1];
	if (!firstLeg.departure || !lastLeg.arrival) return "Unknown duration";

	const departure = new Date(firstLeg.departure);
	const arrival = new Date(lastLeg.arrival);
	if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) {
		return "Invalid duration";
	}

	const diff = arrival.getTime() - departure.getTime();
	if (diff < 0) return "Invalid duration";
	if (diff > 24 * 60 * 60 * 1000) return "Long journey";

	const minutes = Math.floor(diff / 60000);
	return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export const getLineInfoFromLeg = (leg: VendoLeg) => {
	if (leg.walking) return null;
	return leg.line?.name || leg.line?.product || "Unknown";
};

/**
 * TODO:
 * looking at the original code, it's unclear to me which type of arg
 * this function exactly permits.
 * it's called with leg.origin and leg.destination, which can be stations,
 * stops, or locations, not *just* stops.
 */
export const getStationName = (stop?: VendoOriginOrDestination) =>
	stop?.station?.name || stop?.name || "Unknown";

export const calculateTransferTimeInMinutes = (leg: VendoLeg) => {
	if (!leg.walking || !leg.departure || !leg.arrival) return 0;
	return Math.round(
		(new Date(leg.arrival).getTime() - new Date(leg.departure).getTime()) /
			60000
	);
};

// Filter out walking legs and get non-walking legs with transfer times
export const getJourneyLegsWithTransfers = (journey: VendoJourney) => {
	const legs = journey?.legs || [];

	return legs
		.map((leg, i) => {
			if (leg.walking) return null;
			const next = legs[i + 1];
			return {
				...leg,
				transferTimeAfter: next?.walking ? calculateTransferTimeInMinutes(next) : 0,
			};
		})
		.filter(Boolean) as (VendoLeg & { transferTimeAfter: number })[];
};

// =================
// API Functions
// =================

/**
 * @param {Object} extractedData - The journey data extracted from URL
 * @throws {Error} When API call fails or returns error
 */
export const searchForJourneys = async (
	extractedData: ExtractedData
): Promise<VendoJourney[]> => {
	const {
		fromStationId,
		toStationId,
		date,
		time,
		discount = "none",
		hasDeutschlandTicket,
		passengerAge,
		travelClass,
	} = extractedData;

	// Validate required fields
	if (!fromStationId || !toStationId) {
		throw new Error(
			"Unvollständige Reisedaten: Start- und Zielbahnhof erforderlich"
		);
	}

	let departureTime = "";
	if (date && time) {
		departureTime = `${date}T${time}:00`;
	}

	const urlParams = new URLSearchParams({
		from: fromStationId,
		to: toStationId,
		...(departureTime && { departure: departureTime }),
	});

	// Add optional parameters
	if (discount !== "none") {
		urlParams.append("discount", discount);
	}

	if (hasDeutschlandTicket) {
		urlParams.append("hasDeutschlandTicket", "true");
	}

	if (passengerAge && passengerAge.trim() !== "") {
		urlParams.append("passengerAge", passengerAge.trim());
	}

	if (travelClass) {
		urlParams.append("travelClass", travelClass);
	}

	try {
		const response = await fetch(`/api/journeys?${urlParams}`);
		
		if (!response.ok) {
			let errorMessage = "Fehler beim Laden der Verbindungen";
			try {
				const data = await response.json();
				errorMessage = data.error || errorMessage;
			} catch {
				// If JSON parsing fails, use a generic error message
				errorMessage = `Server Error: ${response.status} ${response.statusText}`;
			}
			throw new Error(errorMessage);
		}

		const data = await response.json();
		return data.journeys || [];
	} catch (error) {
		const typedError = error as { message: string };

		// Re-throw with more user-friendly message if it's a network error
		if (typedError.message.includes("fetch")) {
			throw new Error(
				"Netzwerkfehler: Bitte überprüfe deine Internetverbindung"
			);
		}
		throw error;
	}
};
