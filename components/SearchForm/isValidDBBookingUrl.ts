export const isValidDBBookingUrl = (url: string) => {
	try {
		const urlObj = new URL(url);

		// Überprüfe, ob es eine gültige Bahn.de Buchungs-URL ist
		if (!urlObj.hostname.includes("bahn.de")) {
			return false;
		}

		if (!urlObj.pathname.includes("/buchung/start")) {
			return false;
		}

		const requiredParams = ["vbid"];
		const commonParams = ["ot", "rt", "dt", "so", "zo"];

		const hasRequiredParams = requiredParams.some((param) =>
			urlObj.searchParams.has(param),
		);

		if (!hasRequiredParams) {
			return commonParams.some((param) => urlObj.searchParams.has(param));
		}

		return true;
	} catch {
		return false;
	}
};
