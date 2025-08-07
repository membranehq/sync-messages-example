"use client";

import { useIntegrationApp, useIntegrations } from "@integration-app/react";
import type { Integration as IntegrationAppIntegration } from "@integration-app/sdk";
import { useUserPlatform } from "@/hooks/use-user-platform";
import { useState } from "react";

export function IntegrationList() {
	const integrationApp = useIntegrationApp();
	const { integrations, refresh } = useIntegrations();
	const { fetchUserPlatformInfo } = useUserPlatform();

	// Track individual integration states
	const [integrationStates, setIntegrationStates] = useState<
		Record<
			string,
			{
				isConnecting?: boolean;
				isFetching?: boolean;
				lastFetchResult?: Record<string, unknown>;
				error?: string;
			}
		>
	>({});

	// Remove auto-fetching - we'll only fetch after successful connections

	const handleConnect = async (integration: IntegrationAppIntegration) => {
		try {
			// Set connecting state for this integration
			setIntegrationStates((prev) => ({
				...prev,
				[integration.key]: {
					...prev[integration.key],
					isConnecting: true,
					error: undefined,
				},
			}));

			console.log(`🔗 Connecting to ${integration.name}...`);
			const connection = await integrationApp
				.integration(integration.key)
				.openNewConnection();

			// Wait for the connection to be established and refresh the integrations list
			await refresh();

			// Wait a bit more for the connection to be fully processed
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Set fetching state for this integration
			setIntegrationStates((prev) => ({
				...prev,
				[integration.key]: {
					...prev[integration.key],
					isConnecting: false,
					isFetching: true,
				},
			}));

			// Fetch user platform info after successful connection
			console.log("🔄 Fetching user platform info after connection...");
			const result = await fetchUserPlatformInfo();

			// Update state with result
			setIntegrationStates((prev) => ({
				...prev,
				[integration.key]: {
					...prev[integration.key],
					isFetching: false,
					lastFetchResult: result,
				},
			}));

			console.log("✅ Connection and user platform info fetch completed");

			// Get user info after successful connection using the returned connection
			if (connection?.id) {
				try {
					console.log(`🔍 Fetching user info for connection: ${connection.id}`);
					const userResult = await integrationApp
						.connection(connection.id)
						.flow("get-users-ids")
						.run();

					console.log("✅ User info fetched:", userResult);
				} catch (error) {
					console.error("Failed to fetch user info:", error);
				}
			} else {
				console.warn("No connection ID returned from openNewConnection");
			}
		} catch (error) {
			console.error("Failed to connect or fetch user platform info:", error);

			// Set error state for this integration
			setIntegrationStates((prev) => ({
				...prev,
				[integration.key]: {
					...prev[integration.key],
					isConnecting: false,
					isFetching: false,
					error: error instanceof Error ? error.message : "Unknown error",
				},
			}));
		}
	};

	const handleDisconnect = async (integration: IntegrationAppIntegration) => {
		if (!integration.connection?.id) return;
		try {
			await integrationApp.connection(integration.connection.id).archive();
			refresh();

			// Clear the integration state when disconnecting
			setIntegrationStates((prev) => ({
				...prev,
				[integration.key]: {},
			}));
		} catch (error) {
			console.error("Failed to disconnect:", error);
		}
	};

	return (
		<div className="space-y-4 mt-8">
			<ul className="space-y-4">
				{integrations.map((integration) => {
					const state = integrationStates[integration.key] || {};

					return (
						<li
							key={integration.key}
							className="group flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
						>
							<div className="flex-shrink-0">
								{integration.logoUri ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={integration.logoUri}
										alt={`${integration.name} logo`}
										className="w-10 h-10 rounded-lg"
									/>
								) : (
									<div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg font-medium text-gray-600 dark:text-gray-300">
										{integration.name[0]}
									</div>
								)}
							</div>
							<div className="flex-1 min-w-0">
								<h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
									{integration.name}
								</h3>

								{/* Individual status indicators */}
								{state.isConnecting && (
									<div className="flex items-center mt-1">
										<div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
										<span className="text-blue-600 dark:text-blue-400 text-xs">
											Connecting...
										</span>
									</div>
								)}

								{state.isFetching && (
									<div className="flex items-center mt-1">
										<div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-500 mr-2"></div>
										<span className="text-green-600 dark:text-green-400 text-xs">
											Fetching user info...
										</span>
									</div>
								)}

								{state.lastFetchResult && (
									<div className="flex items-center mt-1">
										<span className="text-green-600 dark:text-green-400 text-xs">
											✅ User info updated
										</span>
									</div>
								)}

								{state.error && (
									<div className="flex items-center mt-1">
										<span className="text-red-600 dark:text-red-400 text-xs">
											❌ {state.error}
										</span>
									</div>
								)}
							</div>
							<button
								onClick={() =>
									integration.connection
										? handleDisconnect(integration)
										: handleConnect(integration)
								}
								disabled={state.isConnecting || state.isFetching}
								className={`px-4 py-2 rounded-md font-medium transition-colors ${
									integration.connection
										? "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100 hover:bg-red-200 hover:text-red-800 dark:hover:bg-red-800 dark:hover:text-red-100"
										: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-700 dark:hover:text-blue-100"
								} ${
									state.isConnecting || state.isFetching
										? "opacity-50 cursor-not-allowed"
										: ""
								}`}
							>
								{integration.connection ? "Disconnect" : "Connect"}
							</button>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
