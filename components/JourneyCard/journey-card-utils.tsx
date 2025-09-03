import type { VendoLeg } from "@/utils/schemas";


// Formatiert Datum für deutsche Anzeige
export const formatDate = (dateString: string | undefined) => {
	if (!dateString) {
		return "";
	}

	return new Date(dateString).toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "2-digit",
	});
};

export const TrainIdentifier = ({ leg }: { leg: VendoLeg }) => {
	// Try to get the best train identifier
	if (leg.line?.name) {
		return leg.line.name;
	}

	if (leg.line?.product && leg.line?.productName) {
		return `${leg.line.product} ${leg.line.productName}`;
	}

	if (leg.line?.product) {
		return leg.line.product
	}

	if (leg.line?.mode && typeof leg.line.mode === "string") {
		return leg.line.mode
	}

	if (leg.mode) {
		return leg.mode
	}

	return "Train"
};
