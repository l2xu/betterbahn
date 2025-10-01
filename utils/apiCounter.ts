// Globaler API-Zähler für db-vendo-client Anfragen
let apiCallCount = 0;

// Rate-Limit-Verfolgung
let requestTimes: number[] = [];
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 Minute in Millisekunden
const MAX_REQUESTS_PER_MINUTE = 60; // DB API Limit

export function incrementApiCount(endpoint: string, description = "") {
	apiCallCount++;

	// Anfragzeit für Rate-Limiting verfolgen
	const now = Date.now();
	requestTimes.push(now);

	// Alte Anfragen außerhalb des Zeitfensters entfernen
	requestTimes = requestTimes.filter((time) => now - time < RATE_LIMIT_WINDOW);

	const logMessage = description
		? `🚆 API Call #${apiCallCount} - ${endpoint}: ${description}`
		: `🚆 API Call #${apiCallCount} - ${endpoint}`;

	console.log(`\n===============================`);
	console.log(logMessage);
	console.log(`Total API calls so far: ${apiCallCount}`);
	console.log(
		`Requests in last minute: ${requestTimes.length}/${MAX_REQUESTS_PER_MINUTE}`,
	);

	// Warnung, wenn Rate-Limit sich nähert
	if (requestTimes.length >= MAX_REQUESTS_PER_MINUTE * 0.8) {
		console.log(
			`⚠️  WARNING: Approaching rate limit! (${requestTimes.length}/${MAX_REQUESTS_PER_MINUTE})`,
		);
	}
	if (requestTimes.length >= MAX_REQUESTS_PER_MINUTE) {
		console.log(
			`🚨 RATE LIMIT REACHED! Consider adding delays between requests.`,
		);
	}

	console.log(`===============================\n`);

	return apiCallCount;
}

export function getApiCount() {
	return apiCallCount;
}

export function resetApiCount() {
	apiCallCount = 0;
	requestTimes = [];
	console.log(`\n🔄 API Counter reset to 0\n`);
}
