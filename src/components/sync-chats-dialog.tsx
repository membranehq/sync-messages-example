import { useState, useEffect, useMemo } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, MessageCircle, Search } from "lucide-react";
import { getAuthHeaders } from "@/lib/fetch-utils";
import { useIntegrations } from "@integration-app/react";

interface Chat {
	id: string;
	name: string;
	participants?: string[];
	lastMessage?: string;
	lastMessageTime?: string;
}

interface ConnectedApp {
	key: string;
	name: string;
	logoUri?: string;
	connection?: {
		id: string;
	};
	// Add additional properties that might be present in the actual integration object
	id?: string;
	uuid?: string;
	state?: string;
	integration?: {
		key: string;
	};
}

interface SyncChatsDialogProps {
	isOpen: boolean;
	onClose: () => void;
	integrationKey?: string | null; // Optional - if not provided, show app selection first
	integrationName?: string; // Optional - if not provided, show app selection first
	onSyncSelected: (
		selectedChatIds: string[],
		importNew: boolean,
		selectedApp?: ConnectedApp
	) => void;
	selectedIntegration?: ConnectedApp | null; // Pass the full integration object if available
}

export function SyncChatsDialog({
	isOpen,
	onClose,
	integrationKey,
	integrationName,
	onSyncSelected,
	selectedIntegration,
}: SyncChatsDialogProps) {
	console.log("🔍 SyncChatsDialog props:", {
		isOpen,
		integrationKey,
		integrationName,
	});

	const { integrations } = useIntegrations();
	const [chats, setChats] = useState<Chat[]>([]);
	const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedApp, setSelectedApp] = useState<ConnectedApp | null>(null);
	const [showAppSelection, setShowAppSelection] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [importNew, setImportNew] = useState(false);
	const [isLoadingImportNew, setIsLoadingImportNew] = useState(false);

	// Get connected integrations
	const connectedApps = integrations.filter(
		(integration) => integration.connection
	) as ConnectedApp[];

	// Debug: Log the structure of integrations
	console.log("🔍 All integrations:", integrations);
	console.log("🔍 Connected apps:", connectedApps);

	// Function to fetch current importNew setting
	const fetchImportNewSetting = async (platformId: string) => {
		try {
			console.log(`🔍 Fetching importNew setting for platform: ${platformId}`);
			const response = await fetch(
				`/api/integrations/import-new?platformId=${platformId}`,
				{
					headers: {
						...getAuthHeaders(),
					},
				}
			);

			console.log(`🔍 Response status: ${response.status}`);
			if (response.ok) {
				const data = await response.json();
				console.log(`🔍 API response data:`, data);
				setImportNew(data.importNew);
				console.log(
					`🔍 Current importNew setting for ${platformId}: ${data.importNew}`
				);
			} else {
				console.error(
					`🔍 API error: ${response.status} ${response.statusText}`
				);
				const errorText = await response.text();
				console.error(`🔍 Error response:`, errorText);
				// Default to true if we can't fetch the setting
				setImportNew(true);
			}
		} catch (error) {
			console.error("Error fetching importNew setting:", error);
			// Default to true if we can't fetch the setting
			setImportNew(true);
		}
	};

	// Function to update importNew setting
	const updateImportNewSetting = async (
		platformId: string,
		newValue: boolean
	) => {
		setIsLoadingImportNew(true);
		try {
			const response = await fetch("/api/integrations/import-new", {
				method: "POST",
				headers: {
					...getAuthHeaders(),
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ platformId, importNew: newValue }),
			});

			if (response.ok) {
				setImportNew(newValue);
				console.log(
					`✅ Updated importNew setting for ${platformId}: ${newValue}`
				);
			} else {
				console.error("Failed to update importNew setting");
			}
		} catch (error) {
			console.error("Error updating importNew setting:", error);
		} finally {
			setIsLoadingImportNew(false);
		}
	};

	// Filter chats based on search query
	const filteredChats = useMemo(() => {
		if (!searchQuery.trim()) return chats;

		const query = searchQuery.toLowerCase();
		return chats.filter(
			(chat) =>
				chat.name.toLowerCase().includes(query) ||
				chat.lastMessage?.toLowerCase().includes(query) ||
				chat.participants?.some((participant) =>
					participant.toLowerCase().includes(query)
				)
		);
	}, [chats, searchQuery]);

	// Determine if we need to show app selection
	useEffect(() => {
		if (isOpen) {
			if (integrationKey && integrationName) {
				// Direct integration provided, use the full selectedIntegration object if available
				// This ensures we have the connection information needed for sync
				if (selectedIntegration && selectedIntegration.key === integrationKey) {
					console.log(
						"🔍 Using full selectedIntegration object:",
						selectedIntegration
					);
					setSelectedApp(selectedIntegration);
				} else {
					console.log(
						"🔍 Creating minimal selectedApp object from integrationKey/Name"
					);
					setSelectedApp({ key: integrationKey, name: integrationName });
				}
				setShowAppSelection(false);
				loadAvailableChats(integrationKey);
			} else {
				// No specific integration, show app selection
				setShowAppSelection(true);
				setSelectedApp(null);
				setChats([]);
				setSelectedChatIds([]);
			}
		} else {
			// Reset state when dialog closes
			setImportNew(false);
			setIsLoadingImportNew(false);
		}
	}, [isOpen, integrationKey, integrationName, selectedIntegration]);

	// Fetch importNew setting when selectedApp changes OR when dialog opens with existing selectedApp
	useEffect(() => {
		if (selectedApp?.key && isOpen) {
			console.log(
				`🔍 Selected app changed to: ${selectedApp.key}, fetching importNew setting`
			);
			fetchImportNewSetting(selectedApp.key);
		}
	}, [selectedApp?.key, isOpen]);

	const loadAvailableChats = async (appKey: string) => {
		setIsLoading(true);
		setError(null);

		try {
			console.log(
				"🔍 Calling available chats API with integrationKey:",
				appKey
			);

			const response = await fetch("/api/chats/available", {
				method: "POST",
				headers: {
					...getAuthHeaders(),
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ integrationKey: appKey }),
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch chats: ${response.status}`);
			}

			const data = await response.json();
			setChats(data.chats || []);

			// importNew setting is now fetched in useEffect when selectedApp changes
		} catch (error) {
			console.error("Error loading available chats:", error);
			setError("Failed to load available chats. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleAppSelect = (app: ConnectedApp) => {
		console.log("🔍 handleAppSelect called with app:", app);
		console.log("🔍 App connection:", app.connection);
		console.log("🔍 App key:", app.key);
		console.log("🔍 App name:", app.name);

		setSelectedApp(app);
		setShowAppSelection(false);
		setSelectedChatIds([]);
		loadAvailableChats(app.key);
		// importNew setting is now fetched in useEffect when selectedApp changes
	};

	const handleBackToAppSelection = () => {
		setSelectedApp(null);
		setShowAppSelection(true);
		setChats([]);
		setSelectedChatIds([]);
	};

	const handleChatToggle = (chatId: string) => {
		setSelectedChatIds((prev) =>
			prev.includes(chatId)
				? prev.filter((id) => id !== chatId)
				: [...prev, chatId]
		);
	};

	const handleSelectAll = () => {
		setSelectedChatIds(filteredChats.map((chat) => chat.id));
	};

	const handleDeselectAll = () => {
		setSelectedChatIds([]);
	};

	const handleSyncSelected = () => {
		if (selectedChatIds.length === 0) {
			setError("Please select at least one chat to sync.");
			return;
		}

		// Use the selectedApp from the dialog, since selectedIntegration might be null
		// when no integration is selected in the sidebar
		const integrationToUse = selectedApp;
		console.log("🔍 handleSyncSelected - using integration:", integrationToUse);
		console.log("🔍 Integration connection:", integrationToUse?.connection);
		console.log("🔍 Integration key:", integrationToUse?.key);
		console.log("🔍 Integration name:", integrationToUse?.name);

		// Ensure the integration object has the proper structure
		if (integrationToUse && !integrationToUse.connection?.id) {
			console.error("❌ Selected app missing connection.id:", integrationToUse);
			setError(
				"Selected app is missing connection information. Please try again."
			);
			return;
		}

		onSyncSelected(selectedChatIds, importNew, integrationToUse || undefined);
		onClose();
	};

	console.log("🔍 SyncChatsDialog rendering with isOpen:", isOpen);
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Download className="w-5 h-5" />
						{showAppSelection
							? "Select App to Sync"
							: `Sync ${selectedApp?.name || integrationName} Chats`}
					</DialogTitle>
				</DialogHeader>

				<div className="flex-1 overflow-hidden flex flex-col">
					{/* App Selection View */}
					{showAppSelection && (
						<>
							<div className="mb-4">
								<p className="text-sm text-gray-600 dark:text-gray-400">
									Select an app to sync chats from:
								</p>
							</div>

							{/* Connected Apps Grid */}
							<div className="flex-1 overflow-y-auto">
								{connectedApps.length === 0 ? (
									<div className="text-center py-8">
										<MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
										<p className="text-gray-500 dark:text-gray-400">
											No connected apps available
										</p>
									</div>
								) : (
									<div className="grid grid-cols-2 gap-4">
										{connectedApps.map((app) => (
											<div
												key={app.key}
												onClick={() => handleAppSelect(app)}
												className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
											>
												<div className="flex items-center gap-3">
													{app.logoUri ? (
														<img
															src={app.logoUri}
															alt={`${app.name} logo`}
															className="w-8 h-8 rounded"
														/>
													) : (
														<div className="w-8 h-8 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
															{app.name[0]}
														</div>
													)}
													<div>
														<div className="font-medium text-gray-900 dark:text-gray-100">
															{app.name}
														</div>
														<div className="text-xs text-gray-500 dark:text-gray-400">
															Connected
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</>
					)}

					{/* Chats Selection View */}
					{!showAppSelection && (
						<>
							{/* Header with back button and select all/none buttons */}
							<div className="flex justify-between items-center mb-4">
								<div className="flex items-center gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={handleBackToAppSelection}
										className="text-gray-500 hover:text-gray-700"
									>
										← Back
									</Button>
									<div className="text-sm text-gray-600 dark:text-gray-400">
										{filteredChats.length} of {chats.length} chats
									</div>
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={handleSelectAll}
										disabled={isLoading}
									>
										Select All
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={handleDeselectAll}
										disabled={isLoading}
									>
										Deselect All
									</Button>
								</div>
							</div>

							{/* Search Bar */}
							<div className="mb-4">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<Input
										placeholder="Search chats by name, message, or participants..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-10"
									/>
								</div>
							</div>

							{/* Error display */}
							{error && (
								<div className="text-red-600 dark:text-red-400 text-sm mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded">
									{error}
								</div>
							)}

							{/* Loading state */}
							{isLoading && (
								<div className="flex-1 flex items-center justify-center">
									<div className="text-center">
										<Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
										<p className="text-sm text-gray-500 dark:text-gray-400">
											Loading available chats...
										</p>
									</div>
								</div>
							)}

							{/* Chats list */}
							{!isLoading && (
								<div className="flex-1 overflow-y-auto">
									{filteredChats.length === 0 ? (
										<div className="text-center py-8">
											<MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
											<p className="text-gray-500 dark:text-gray-400">
												{searchQuery
													? "No chats match your search"
													: "No chats available to sync"}
											</p>
										</div>
									) : (
										<div className="space-y-2">
											{filteredChats.map((chat) => (
												<div
													key={chat.id}
													className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
												>
													<Checkbox
														checked={selectedChatIds.includes(chat.id)}
														onCheckedChange={() => handleChatToggle(chat.id)}
														className="mt-1"
													/>
													<div className="flex-1 min-w-0">
														<div className="font-medium text-gray-900 dark:text-gray-100 truncate">
															{chat.name}
														</div>
														{chat.lastMessage && (
															<div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
																{chat.lastMessage}
															</div>
														)}
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							)}
						</>
					)}

					{/* Footer with sync button */}
					{!showAppSelection && (
						<div className="flex flex-col space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
							{/* Import New Messages Option */}
							<div className="flex items-center space-x-2">
								<Checkbox
									id="importNew"
									checked={importNew}
									onCheckedChange={async (checked) => {
										const newValue = checked as boolean;
										if (selectedApp?.key) {
											await updateImportNewSetting(selectedApp.key, newValue);
										}
									}}
									disabled={isLoadingImportNew}
								/>
								<Label
									htmlFor="importNew"
									className="text-sm text-gray-700 dark:text-gray-300"
								>
									Automatically import new messages from chats not in the list
									above
									{isLoadingImportNew && (
										<span className="ml-2 text-xs text-gray-500">
											(saving...)
										</span>
									)}
								</Label>
							</div>

							{/* Sync Button Row */}
							<div className="flex justify-between items-center">
								<div className="text-sm text-gray-600 dark:text-gray-400">
									{selectedChatIds.length} of {filteredChats.length} chats
									selected
								</div>
								<div className="flex gap-2">
									<Button variant="outline" onClick={onClose}>
										Cancel
									</Button>
									<Button
										onClick={handleSyncSelected}
										disabled={selectedChatIds.length === 0 || isLoading}
										className="flex items-center gap-2"
									>
										<Download className="w-4 h-4" />
										Sync Selected ({selectedChatIds.length})
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
