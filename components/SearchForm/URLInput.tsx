import { useState, type Dispatch } from "react";
import { HelpSection } from "./HelpSection";

export const URLInput = ({
	setUrl,
	url,
}: {
	url: string;
	setUrl: Dispatch<string>;
}) => {
	const [showHelp, setShowHelp] = useState(false);

	return (
		<div className="relative">
			<div className="flex items-center gap-2 mb-2">
				<label htmlFor="url" className="text-sm font-medium opacity-80">
					Deutsche Bahn "Verbindung Teilen Text"
				</label>
				<button
					type="button"
					onClick={() => setShowHelp(!showHelp)}
					className="inline-flex items-center justify-center w-5 h-5 text-xs bg-accent text-muted-foreground rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
					aria-label="Hilfe anzeigen"
				>
					?
				</button>
			</div>
			<input
				id="url"
				value={url}
				onChange={(e) => setUrl(e.target.value)}
				placeholder={`Dein "Teilen"-Text von der Deutschen Bahn`}
				className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-base"
			/>

			{showHelp && <HelpSection />}
		</div>
	);
};
