export const extractUrlParams = (url: string) => {
	const { searchParams } = new URL(url);

	return {
		from: searchParams.get("from"),
		to: searchParams.get("to"),
		departure: searchParams.get("departure"),
		results: searchParams.get("results") || "10",
		discount: searchParams.get("discount"),
		hasDeutschlandTicket: searchParams.get("hasDeutschlandTicket") === "true",
		passengerAge: searchParams.get("passengerAge"),
		travelClass: searchParams.get("travelClass") || "2",
	};
};

export type JourneyUrlParams = ReturnType<typeof extractUrlParams>;
