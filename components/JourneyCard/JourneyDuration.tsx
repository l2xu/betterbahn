import type { VendoJourney } from "@/utils/schemas";
import { formatDuration } from "@/utils/formatUtils";

export const JourneyDuration = ({ journey }: { journey: VendoJourney }) => {
	const duration = formatDuration(journey);
	return duration || "Duration unavailable";
};
