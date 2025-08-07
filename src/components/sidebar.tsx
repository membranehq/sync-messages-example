"use client";

import { useState } from "react";
import { useIntegrations, useIntegrationApp } from "@integration-app/react";
import { Plus, Settings, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { IntegrationsDialog } from "@/components/integrations-dialog";
import { useIntegrationContext } from "@/contexts/integration-context";

export function Sidebar() {
	const { integrations } = useIntegrations();
	const integrationApp = useIntegrationApp();
	const { theme, setTheme } = useTheme();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const { selectedIntegration, setSelectedIntegration } =
		useIntegrationContext();

	// Get connected and unconnected integrations
	const connectedIntegrations = integrations.filter(
		(integration) => integration.connection
	);
	const unconnectedIntegrations = integrations.filter(
		(integration) => !integration.connection
	);

	return (
		<div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-16">
			{/* Logo */}
			<div className="p-2 border-b border-gray-200 dark:border-gray-700">
				<div className="w-12 h-12 flex items-center justify-center">
					<img src="/logo.svg" alt="App Logo" className="w-8 h-8 dark:invert" />
				</div>
			</div>

			{/* Connected Apps */}
			<div className="flex-1 p-2 space-y-2">
				{connectedIntegrations.map((integration) => {
					const isSelected = selectedIntegration?.key === integration.key;

					return (
						<div
							key={integration.key}
							className="relative group"
							title={integration.name}
						>
							<div
								onClick={() => setSelectedIntegration(integration)}
								className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
									isSelected
										? "bg-blue-100 dark:bg-blue-800 border-2 border-blue-500"
										: "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
								}`}
							>
								{integration.logoUri ? (
									<img
										src={integration.logoUri}
										alt={`${integration.name} logo`}
										className="w-8 h-8 rounded"
									/>
								) : (
									<div className="w-8 h-8 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
										{integration.name[0]}
									</div>
								)}
							</div>
							{/* Connection indicator */}
							<div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
						</div>
					);
				})}

				{/* Add Integration Button */}
				<div className="pt-2">
					<div
						onClick={() => setIsDialogOpen(true)}
						className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
						title="Add Integration"
					>
						<Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
					</div>
				</div>

				{/* Unconnected Apps Section */}
				{unconnectedIntegrations.length > 0 && (
					<div className="pt-4 space-y-2">
						{/* Separator */}
						<div className="h-px bg-gray-200 dark:bg-gray-600 mx-2"></div>

						{/* Unconnected apps */}
						{unconnectedIntegrations.map((integration, index) => {
							// Calculate opacity based on position - more faded as we go down
							const opacity = Math.max(0.1, 0.4 - index * 0.1);

							return (
								<div
									key={integration.key}
									className="relative group transition-opacity"
									style={{ opacity }}
									title={`${integration.name} (Not connected)`}
								>
									<div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
										{integration.logoUri ? (
											<img
												src={integration.logoUri}
												alt={`${integration.name} logo`}
												className="w-8 h-8 rounded"
											/>
										) : (
											<div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-400 dark:text-gray-500">
												{integration.name[0]}
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Bottom Actions */}
			<div className="p-2 space-y-2 border-t border-gray-200 dark:border-gray-700">
				{/* Theme Toggle */}
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
					className="w-12 h-12 rounded-lg"
					title="Toggle theme"
				>
					{theme === "dark" ? (
						<Sun className="w-5 h-5" />
					) : (
						<Moon className="w-5 h-5" />
					)}
				</Button>

				{/* Settings */}
				<Button
					variant="ghost"
					size="icon"
					onClick={async () => {
						try {
							await integrationApp.open();
						} catch (error) {
							console.error("Failed to open integration app:", error);
						}
					}}
					className="w-12 h-12 rounded-lg"
					title="Settings"
				>
					<Settings className="w-5 h-5" />
				</Button>
			</div>

			{/* Integrations Dialog */}
			<IntegrationsDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
		</div>
	);
}
