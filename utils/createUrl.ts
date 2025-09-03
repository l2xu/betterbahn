import type { VendoJourney } from "./schemas";

interface Station {
	id?: string;
	stationId?: string;
	uicCode?: string;
	evaId?: string;
	name?: string;
	longitude?: number;
	latitude?: number;
	x?: number;
	y?: number;
}

/**
 * Formats a date string for DB URL parameters
 * @param {string} date - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(date: string): string {
	let formattedDate = date
		.replace(/\+\d{2}:\d{2}$/, "")
		.replace(/Z$/, "")
		.replace(/\.\d{3}/, "");
	if (/T\d{2}:\d{2}$/.test(formattedDate)) formattedDate += ":58"; // ensure seconds
	if (!formattedDate.includes("T")) formattedDate += "T08:32:58"; // default time
	return formattedDate;
}

/**
 * Creates a station ID string in DB format
 * @param {Object} station - Station object with name, id, and coordinates
 * @returns {string} Encoded station ID
 */
function createStationId(station: Station): string {
	const stationString = Object.entries({
		A: "1",
		O: station.name,
		X: station.x ?? station.longitude ?? "",
		Y: station.y ?? station.latitude ?? "",
		U: "80",
		L: station.id,
		B: "1",
		p: "1750104613",
		i: `U×${String(station.id).padStart(9, "0")}`,
	})
		.map(([k, v]) => `${k}=${v}`)
		.join("@");
	return encodeURIComponent(stationString);
}

/**
 * Creates a DB search URL for a journey segment
 * @param {Object} segment - Journey segment object
 * @param {number} travelClass - Travel class (1 or 2)
 * @returns {string} DB website search URL
 */
export function createSegmentSearchUrl(
	segment: VendoJourney,
	travelClass: number = 2
): string {
	if (!segment?.legs?.length)
		throw new Error("Invalid segment: missing legs data");
	const legs = segment.legs;
	const firstLeg = legs[0];
	const lastLeg = legs[legs.length - 1];
	const cleanDate = formatDate(firstLeg.departure);

	// Modern URL building with proper validation

	// Properly validate required data with explicit checks for optional properties
	if (!firstLeg?.origin || !firstLeg.origin.name || 
		!lastLeg?.destination || !lastLeg.destination.name) {
		throw new Error('Missing origin, destination, or station names in journey legs');
	}

	const parts = [
		"sts=true",
		`so=${encodeURIComponent(firstLeg.origin.name)}`,
		`zo=${encodeURIComponent(lastLeg.destination.name)}`,
		`kl=${travelClass}`,
		"r=13:16:KLASSENLOS:1",
	];

	const originId = addStationId(firstLeg.origin, "s", parts);
	const destId = addStationId(lastLeg.destination, "z", parts);

	parts.push("sot=ST", "zot=ST");

	if (originId && firstLeg.origin.name) {
		parts.push(`soei=${originId}`);
	}

	if (destId && lastLeg.destination.name) {
		parts.push(`zoei=${destId}`);
	}

	parts.push(
		`hd=${cleanDate}`,
		"hza=D",
		"hz=%5B%5D",
		"ar=false",
		"s=false",
		"d=false",
		"vm=00,01,02,03,04,05,06,07,08,09",
		"fm=false",
		"bp=false",
		"dlt=false",
		"dltv=false"
	);

	return `https://www.bahn.de/buchung/fahrplan/suche#${parts.join("&")}`;
}

/**
 * Helper function to add station ID to URL parameters
 * @param {Object} station - Station object
 * @param {string} type - Station type ('s' for origin, 'z' for destination)
 * @param {Array} parts - URL parts array to modify
 * @returns {string|null} Station ID if found
 */
/**
 * Known problematic station mappings - station IDs that don't match expected names
 */
const PROBLEMATIC_STATION_IDS: Record<string, string> = {
	// Add known problematic mappings here
	8002235: "Senden", // This ID seems to resolve to Senden instead of Gengenbach
};

/**
 * Validates if a station ID should be used based on the station name
 * @param {string} stationId - The station ID
 * @param {string} stationName - The station name
 * @returns {boolean} - Whether the station ID is safe to use
 */
function shouldUseStationId(stationId: string, stationName: string) {
	if (!stationId || !stationName) return false;
	const problematicName = PROBLEMATIC_STATION_IDS[stationId];
	if (
		problematicName &&
		!stationName.toLowerCase().includes(problematicName.toLowerCase())
	) {
		console.warn(
			`Skipping problematic station ID ${stationId} for ${stationName} (maps to ${problematicName})`
		);
		return false;
	}
	return true;
}

function addStationId(station: Station, type: string, parts: string[]) {
	const stationId =
		station.id || station.stationId || station.uicCode || station.evaId;

	if (stationId && station.name && shouldUseStationId(stationId, station.name)) {
		const stationData = createStationId({
			name: station.name,
			id: stationId,
			x: station.longitude || station.x,
			y: station.latitude || station.y,
		});
		parts.push(`${type}oid=${stationData}`);
		return stationId;
	}

	return null;
}

