export function JourneyIcon() {
	return (
		<div className="flex flex-col items-center mr-4 pt-1">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="h-6 w-6 text-foreground/70"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth="1.5"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M6 20h12M6 16h12M8 16V9a4 4 0 014-4h0a4 4 0 014 4v7"
				/>
			</svg>
			<div className="h-16 w-px bg-foreground/30 my-2"></div>
			<div className="w-2.5 h-2.5 rounded-full bg-foreground/60"></div>
		</div>
	);
}