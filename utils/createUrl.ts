import type { VendoJourney } from "./schemas";

interface Station {
	id?: string;
	stationId?: string;
	uicCode?: string;
	evaId?: string;
	name: string;
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
 * Maps BetterBahn discount values to DB website format
 * @param discountTypes - Discount type from BetterBahn form
 * @param travelClass - Travel class (1 or 2)
 * @returns DB-compatible discount parameter
 */
function mapDiscountToDBFormat(discountTypes: string[], travelClass: number): string {
	// Handle array of discounts (max 4)
	const discounts = discountTypes;
	if (discounts.length > 4) {
		throw new Error("Maximum 4 discounts allowed simultaneously");
	}
	
	const classString = travelClass === 1 ? "KLASSE_1" : "KLASSE_2";
	
	// DB r= parameter codes for discount types
	const rCodeMapping: Record<string, string> = {
		// German BahnCards
		"25": `17:${classString}`,
		"50": `23:${classString}`,
		"business25": `19:${classString}`,
		"business50": `18:${classString}`,
		
		// Deutschland-Ticket
		"deutschlandticket": `16:KLASSENLOS`,
		
		// International discounts
		"ch-general": `1:${classString}`,
		"ch-halbtax": `21:KLASSENLOS`,
		"at-vorteil": `20:KLASSENLOS`,
		"nl-40": `22:KLASSENLOS`,
		"klimaticket": `7:${classString}`
	};
	
	const validDiscounts = discounts.filter(d => d && d !== "none" && rCodeMapping[d]);
	if (validDiscounts.length === 0) return travelClass === 1 ? "13:0:KLASSE_1:1" : "13:0:KLASSE_2:1";
	
	if (validDiscounts.length === 1) {
		// Single discount: r=13:CODE:KLASSE:1
		const code = rCodeMapping[validDiscounts[0]];
		if (!code) throw new Error(`Unknown discount code: ${validDiscounts[0]}`);
		return `13:${code}:1`;
	} else {
		// Multiple discounts: r=13:MAIN[EXTRA1|EXTRA2|EXTRA3]:1
		const mainCode = rCodeMapping[validDiscounts[0]];
		if (!mainCode) throw new Error(`Unknown discount code: ${validDiscounts[0]}`);
		const extraCodes = validDiscounts.slice(1).map(d => {
			const code = rCodeMapping[d];
			if (!code) throw new Error(`Unknown discount code: ${d}`);
			return code;
		}).join("|");
		return `13:${mainCode}[${extraCodes}]:1`;
	}
}

/**
 * Creates a DB search URL for a journey segment
 * @param {Object} segment - Journey segment object
 * @param {number} travelClass - Travel class (1 or 2)
 * @returns {string} DB website search URL
 */
export function createSegmentSearchUrl(
	segment: VendoJourney,
	travelClass: number = 2,
	discount: string | string[] = "none",
	hasDeutschlandTicket: boolean = false
): string {
	if (!segment?.legs?.length)
		throw new Error("Invalid segment: missing legs data");
	const legs = segment.legs;
	const firstLeg = legs[0];
	const lastLeg = legs[legs.length - 1];
	const cleanDate = formatDate(firstLeg.departure);

	// TODO diesen code zu new URL -> .searchParams.set() usw porten

	/**
	 * TODO looking at the original code, the majority treats origin and destination
	 * as optional / possibly undefined properties.
	 * the following logic, from the original code, doesn't treat them as such, which could be an oversight.
	 * i did not find any checking logic further up the component/call stack that ensures their presence.
	 */

	// Generate r parameter with discount codes
	const discountCodes: string[] = [];
	
	if (hasDeutschlandTicket) {
		discountCodes.push("deutschlandticket");
	}
	if (discount !== "none") {
		const discountArray = Array.isArray(discount) ? discount : [discount];
		discountCodes.push(...discountArray);
	}
	
	const rParam = discountCodes.length > 0
		? mapDiscountToDBFormat(discountCodes, travelClass)
		: (travelClass === 1 ? "13:0:KLASSE_1:1" : "13:0:KLASSE_2:1");

	const baseUrl = new URL("https://www.bahn.de/buchung/fahrplan/suche");
	const params = new URLSearchParams({
		sts: "true",
		so: firstLeg.origin.name,
		zo: lastLeg.destination.name,
		kl: travelClass.toString(),
		r: rParam,
		hd: cleanDate,
		hza: "D",
		hz: "%5B%5D",
		ar: "false",
		s: "false",
		d: "false",
		vm: "00,01,02,03,04,05,06,07,08,09",
		fm: "false",
		bp: "false",
		dlt: "false",
		dltv: hasDeutschlandTicket ? "true" : "false",
		sot: "ST",
		zot: "ST"
	});

	addStationDataToParams(firstLeg.origin, lastLeg.destination, params);

	return `${baseUrl.origin}${baseUrl.pathname}#${params.toString()}`;
}

/**
 * Known problematic station mappings - station IDs that don't match expected names
 */
const PROBLEMATIC_STATION_IDS: Record<string, string> = {
	// Add known problematic mappings here
	8002235: "Senden", // This ID seems to resolve to Senden instead of Gengenbach
};

/**
 * Validates if a station ID should be used based on the station name
 * @param stationId - The station ID
 * @param stationName - The station name
 * @returns Whether the station ID is safe to use
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

/**
 * Get station ID from various possible properties
 * @param station - Station object
 * @returns Station ID if found
 */
function getStationId(station: any): string | null {
	return station.id || station.stationId || station.uicCode || station.evaId || null;
}

/**
 * Helper function to add station data to URL parameters
 * @param origin - Origin station
 * @param destination - Destination station 
 * @param params - URLSearchParams to modify
 */
function addStationDataToParams(origin: any, destination: any, params: URLSearchParams): void {
	const originId = getStationId(origin);
	const destId = getStationId(destination);

	if (originId && shouldUseStationId(originId, origin.name)) {
		const stationData = createStationId({
			name: origin.name,
			id: originId,
			x: origin.longitude || origin.x,
			y: origin.latitude || origin.y,
		});
		params.set("soid", stationData);
		params.set("soei", originId);
	}

	if (destId && shouldUseStationId(destId, destination.name)) {
		const stationData = createStationId({
			name: destination.name,
			id: destId,
			x: destination.longitude || destination.x,
			y: destination.latitude || destination.y,
		});
		params.set("zoid", stationData);
		params.set("zoei", destId);
	}
}
