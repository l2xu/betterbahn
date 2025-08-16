"use client";

import { useState, useEffect } from "react";
import PasswordDialog from "./PasswordDialog";

export default function AuthProvider({ children }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Check if authentication is required
		const requiredPassword = process.env.NEXT_PUBLIC_AUTH_PASSWORD;
		
		if (!requiredPassword) {
			// No authentication required if password is not set
			setIsAuthenticated(true);
			setIsLoading(false);
			return;
		}

		// Check if user is already authenticated
		const authenticated = localStorage.getItem("betterbahn_authenticated");
		const timestamp = localStorage.getItem("betterbahn_auth_timestamp");
		
		if (authenticated === "true" && timestamp) {
			// Optional: Add session timeout (e.g., 24 hours)
			const authTime = parseInt(timestamp);
			const now = Date.now();
			const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
			
			if (now - authTime < sessionDuration) {
				setIsAuthenticated(true);
			} else {
				// Session expired, clear storage
				localStorage.removeItem("betterbahn_authenticated");
				localStorage.removeItem("betterbahn_auth_timestamp");
			}
		}
		
		setIsLoading(false);
	}, []);

	const handleAuthentication = (authenticated) => {
		setIsAuthenticated(authenticated);
	};

	// Show loading state briefly while checking auth
	if (isLoading) {
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	// Show password dialog if not authenticated and password is required
	if (!isAuthenticated && process.env.NEXT_PUBLIC_AUTH_PASSWORD) {
		return <PasswordDialog onAuthenticate={handleAuthentication} />;
	}

	// Render the app if authenticated or no auth required
	return children;
}