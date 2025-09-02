import { useEffect, useState } from "react";

export interface Updates {
	discount?: string;
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
	discount: string;
	hasDeutschlandTicket: boolean;
	passengerAge: string | number;
	travelClass: string;
}

const INITIAL_FORM_STATE = {
	fromStation: "",
	toStation: "",
	fromStationId: "",
	toStationId: "",
	date: "",
	time: "",
	discount: "none",
	hasDeutschlandTicket: true,
	passengerAge: "",
	travelClass: "2",
};

const loadSettingsFromLocalStorage = () => {
	console.log(localStorage.getItem("betterbahn/settings/discount"));
	const storageDiscount = localStorage.getItem("betterbahn/settings/discount");
	const storageAge = localStorage.getItem("betterbahn/settings/passengerAge");
	const storageDTicket = localStorage.getItem(
		"betterbahn/settings/hasDeutschlandTicket"
	);
	const storageTravelClass = localStorage.getItem(
		"betterbahn/settings/travelClass"
	);

	const updates: Partial<FormState> = {};

	if (storageDiscount != null) {
		updates.discount = storageDiscount;
	}

	if (storageAge !== null) {
		updates.passengerAge = parseInt(storageAge, 10);
	}

	if (storageDTicket !== null) {
		updates.hasDeutschlandTicket = storageDTicket === "true";
	}

	if (storageTravelClass != null) {
		updates.travelClass = storageTravelClass;
	}

	return updates;
};

const updateLocalStorage = (updates: Updates) => {
	if (updates.discount != null) {
		localStorage.setItem("betterbahn/settings/discount", updates.discount);
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
			updates.passengerAge
		);
	}
	if(updates.travelClass != null) {
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
