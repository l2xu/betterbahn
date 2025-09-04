"use client";

import dynamic from "next/dynamic";
import { Hero } from "@/components/Layout/Hero";

// Lazy load SearchForm as it's below the fold
const SearchForm = dynamic(() => import("@/components/SearchForm/SearchForm").then(mod => ({ default: mod.SearchForm })), {
	loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg mt-6"></div>,
	ssr: false // SearchForm has client-side state, so we can skip SSR
});

export default function Home() {
	return (
		<>
			<Hero />
			<SearchForm />
		</>
	);
}
