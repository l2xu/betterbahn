"use client";

import { useState } from "react";

export default function PasswordDialog({ onAuthenticate }) {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		// Get the required password from environment
		const requiredPassword = process.env.NEXT_PUBLIC_AUTH_PASSWORD;
		
		if (!requiredPassword) {
			setError("Authentication is not properly configured");
			setIsLoading(false);
			return;
		}

		if (password === requiredPassword) {
			// Store authentication in localStorage
			localStorage.setItem("betterbahn_authenticated", "true");
			localStorage.setItem("betterbahn_auth_timestamp", Date.now().toString());
			onAuthenticate(true);
		} else {
			setError("Incorrect password. Please try again.");
		}
		
		setIsLoading(false);
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
				<h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
					Authentication Required
				</h2>
				<p className="text-gray-600 mb-6 text-center">
					Please enter the password to access BetterBahn.
				</p>
				
				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter password"
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							disabled={isLoading}
							autoFocus
						/>
					</div>
					
					{error && (
						<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
							{error}
						</div>
					)}
					
					<button
						type="submit"
						disabled={isLoading || !password.trim()}
						className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading ? "Verifying..." : "Enter"}
					</button>
				</form>
			</div>
		</div>
	);
}