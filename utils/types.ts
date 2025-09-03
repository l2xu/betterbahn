import type { VendoJourney, VendoOriginOrDestination, VendoStation } from "@/utils/schemas";

export interface ExtractedData {
	fromStationId?: string | null;
	fromStation?: string | null;
	toStation?: string | null;
	toStationId?: string | null;
	date?: unknown;
	time?: string | null;
	bahnCard?: string;
	hasDeutschlandTicket?: boolean;
	passengerAge?: string;
	travelClass?: string;
	class?: number | null;
	error?: unknown;
}

export interface SplitOption {
	segments: VendoJourney[];
	totalPrice?: number;
	savings?: number;
	splitStations: VendoOriginOrDestination[];
}

export interface ProgressInfo {
	checked: number;
	total: number;
	currentStation?: string;
	message?: string;
}

export interface TrainLine {
	name?: string
	product?: string
}

export interface SplitPoint {
	departure: string;
	arrival: string;
	station: VendoStation;
	trainLine?: TrainLine;
	loadFactor?: unknown;
	legIndex: number;
	stopIndex: number;
}
