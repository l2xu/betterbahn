import { useEffect, useState } from "react";

export interface Updates {
	bahnCard?: string;
	passengerAge?: string;
	hasDeutschlandTicket?: boolean;
	travelClass?: string;
}

export interface FormState {
	fromStation: string;
	toStation: string;
	fromStationId: string;
	toStationId: string;
	date: string;
	time: string;
	bahnCard: string;
	hasDeutschlandTicket: boolean;
	passengerAge: string;
	travelClass: string;
}

const INITIAL_FORM_STATE = {
	fromStation: "",
	toStation: "",
	fromStationId: "",
	toStationId: "",
	date: "",
	time: "",
	bahnCard: "none",
	hasDeutschlandTicket: true,
	passengerAge: "",
	travelClass: "2",
};

const loadSettingsFromLocalStorage = () => {
	console.log(localStorage.getItem("betterbahn/settings/bahnCard"));
	const storageBahnCard = localStorage.getItem("betterbahn/settings/bahnCard");
	const storageAge = localStorage.getItem("betterbahn/settings/passengerAge");
	const storageDTicket = localStorage.getItem(
		"betterbahn/settings/hasDeutschlandTicket"
	);
	const storageTravelClass = localStorage.getItem(
		"betterbahn/settings/travelClass"
	);

	const updates: Partial<FormState> = {};

	if (storageBahnCard !== null) {
		updates.bahnCard = storageBahnCard;
	}

	if (storageAge !== null) {
		const parsedAge = parseInt(storageAge, 10);
		updates.passengerAge = isNaN(parsedAge) ? "" : String(parsedAge);
	}

	if (storageDTicket !== null) {
		updates.hasDeutschlandTicket = storageDTicket === "true";
	}

	if (storageTravelClass !== null) {
		updates.travelClass = storageTravelClass;
	}

	return updates;
};

const updateLocalStorage = (updates: Updates) => {
	if (updates.bahnCard !== undefined) {
		localStorage.setItem("betterbahn/settings/bahnCard", updates.bahnCard);
	}
	if (updates.hasDeutschlandTicket !== null) {
		localStorage.setItem(
			"betterbahn/settings/hasDeutschlandTicket",
			String(updates.hasDeutschlandTicket)
		);
	}
	if (updates.passengerAge !== null) {
		localStorage.setItem(
			"betterbahn/settings/passengerAge",
			String(updates.passengerAge || '')
		);
	}
	if(updates.travelClass !== undefined) {
		localStorage.setItem(
			"betterbahn/settings/travelClass",
			updates.travelClass
		);
	}
};

export const useSearchFormData = () => {
	const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);

	useEffect(() => {
		const updates = loadSettingsFromLocalStorage();
		setFormData((prev) => ({ ...prev, ...updates }));
	}, []);

	const updateFormData = (updates: Updates) => {
		updateLocalStorage(updates);
		setFormData((prev) => ({ ...prev, ...updates }));
	};

	return { formData, updateFormData };
};
