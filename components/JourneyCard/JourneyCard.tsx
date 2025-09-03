"use client";

import type { VendoJourney } from "@/utils/schemas";
import { formatPriceDE } from "@/utils/priceUtils";
import { getTransferStations } from "./getTransferStations";
import { formatTime } from "@/utils/formatUtils";
import { formatDate } from "./journey-card-utils";
import { JourneyDuration } from "./JourneyDuration";
import { LegDetails } from "./LegDetails";

export const JourneyCard = ({
	journey,
	travelClass,
	isSelected = false,
}: {
	journey: VendoJourney;
	travelClass?: string;
	isSelected?: boolean;
}) => {
	const firstLeg = journey.legs.at(0);
	const lastLeg = journey.legs.at(-1);
	const nonWalkingLegs = journey.legs.filter((leg) => !leg.walking);
	const transferCountWithoutWalking = Math.max(0, nonWalkingLegs.length - 1);
	const transferStationsWithoutWalking = getTransferStations(nonWalkingLegs);

	const priceDisplay = journey.price?.amount !== undefined
		? formatPriceDE(journey.price.amount)
		: "Price on request";

	return (
		<div
			className={`border rounded-lg p-4 transition-all duration-200 ${
				isSelected
					? "border-blue-500 bg-background shadow-md"
					: "border-foreground/30 bg-background/60 hover:shadow-md hover:bg-foreground/10"
			}`}
		>
			{/* Journey Header - Similar to SplitOptions */}
			<div className="flex justify-between items-center mb-2">
				<div>
					<span className="text-sm text-foreground/60">Journey:</span>
					<span className="text-lg font-bold text-blue-600 ml-2">
						{formatTime(firstLeg?.departure)} → {formatTime(lastLeg?.arrival)}
					</span>
					{transferCountWithoutWalking > 0 &&
						transferStationsWithoutWalking.length > 0 && (
							<span className="ml-2 text-sm text-green-600 font-medium">
								🚆 via {transferStationsWithoutWalking.join(", ")}
							</span>
						)}
				</div>
				<div className="text-right">
					<div className="text-sm text-foreground/60">
						<JourneyDuration journey={journey} />
					</div>
					<div className="text-lg font-bold text-foreground">{priceDisplay}</div>
				</div>
			</div>

			{/* Route Summary */}
			<div className="text-sm text-foreground/70 mb-2">
				{firstLeg?.origin?.name || "Unknown"} →{" "}
				{lastLeg?.destination?.name || "Unknown"}
				{transferCountWithoutWalking > 0 && (
					<span className="ml-2 text-xs text-orange-600">
						({transferCountWithoutWalking} transfer
						{transferCountWithoutWalking > 1 ? "s" : ""})
					</span>
				)}
			</div>

			{/* Journey Legs - Similar to SplitOptions segments */}
			<div className="text-xs text-foreground/60 space-y-1 mb-3">
				{journey.legs
					?.filter((leg) => !leg.walking)
					.map((leg, legIndex) => (
						<LegDetails key={legIndex} leg={leg} legIndex={legIndex} />
					))}
			</div>

			{/* Journey Summary - Similar to SplitOptions pricing summary */}
			<div className="border-t pt-3 flex justify-between items-center">
				<div>
					<div className="text-sm font-medium text-foreground/80">
						Total: {priceDisplay}
					</div>
					<div className="text-xs text-foreground/70">
						{travelClass === "1" ? "1st Class" : "2nd Class"}
						{transferCountWithoutWalking > 0 &&
							transferStationsWithoutWalking.length > 0 && (
								<span className="ml-2">
									• {transferCountWithoutWalking} transfer
									{transferCountWithoutWalking > 1 ? "s" : ""}
								</span>
							)}
					</div>
				</div>
				<div className="text-right">
					<div className="text-xs text-foreground/60">
						<JourneyDuration journey={journey} />
					</div>
					<div className="text-xs text-blue-600">
						{formatDate(firstLeg?.departure)} •{" "}
						{formatTime(firstLeg?.departure)}-{formatTime(lastLeg?.arrival)}
					</div>
				</div>
			</div>
		</div>
	);
};
