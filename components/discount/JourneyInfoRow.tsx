import type { ReactNode } from "react";

interface JourneyInfoRowProps {
	children: ReactNode;
}

export function JourneyInfoRow({ children }: JourneyInfoRowProps) {
	return <div className="text-sm  my-2 pl-1 flex items-center">{children}</div>;
}