// Konstanten für Lademeldungen
export const LOADING_MESSAGES = {
	parsing: "Wir analysieren die URL...",
	searching: "Wir suchen nach deiner Verbindung...",
	analyzing: "Analysiere Split-Ticket Optionen...",
	single_journey_flow:
		"Wir haben eine Verbindung gefunden und suchen nach Split-Ticket Optionen...",
	initial: "Wir extrahieren deine Reisedaten...",
};

// Status-Konstanten für den App-Zustand
export const STATUS = {
	LOADING: "loading",
	SELECTING: "selecting",
	ANALYZING: "analyzing",
	DONE: "done",
	ERROR: "error",
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];