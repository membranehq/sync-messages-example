"use client";

import { useState, useCallback, useMemo } from "react";
import { useMessages } from "@/hooks/use-messages";
import { useChats } from "@/hooks/use-chats";
import { useSyncMessages } from "@/hooks/use-sync-messages";
import { Message } from "@/types/message";
import { sendMessageToThirdParty, validateMessage } from "@/lib/message-api";
import { ensureAuth } from "@/lib/auth";
import { ChatscopeChat } from "@/components/chatscope-chat";
import { ChatListSection } from "@/components/chat-list-section";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageCircle, Download, Loader2, X } from "lucide-react";
import { useIntegrationContext } from "@/contexts/integration-context";
import { SyncChatsDialog } from "@/components/sync-chats-dialog";

export default function MessagesPage() {
	// Hooks
	const {
		messages,
		isLoading: messagesLoading,
		mutate: mutateMessages,
	} = useMessages();
	const { chats, isLoading: chatsLoading, mutate: refreshChats } = useChats();
	const { syncMessages, isSyncing, lastSyncTime, status, error } =
		useSyncMessages();
	const { selectedIntegration, setSelectedIntegration } =
		useIntegrationContext();

	// State
	const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [chatSearchQuery, setChatSearchQuery] = useState("");
	const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);

	// Stable callback for search
	const handleSearchChange = useCallback((value: string) => {
		setChatSearchQuery(value);
	}, []);

	// Computed values
	const filteredChats = useMemo(() => {
		let filtered = chats;

		// Filter by selected integration if one is selected
		if (selectedIntegration) {
			filtered = chats.filter(
				(chat) => chat.integrationId === selectedIntegration.connection?.id
			);
		}

		// Then filter by search query
		return filtered.filter(
			(chat) =>
				chat.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
				chat.platformName
					?.toLowerCase()
					.includes(chatSearchQuery.toLowerCase()) ||
				chat.lastMessage?.toLowerCase().includes(chatSearchQuery.toLowerCase())
		);
	}, [chats, chatSearchQuery, selectedIntegration]);
	const selectedChat = chats.find((chat) => chat.id === selectedChatId);
	const selectedChatName = selectedChat?.name;
	const selectedChatIntegrationId = selectedChat?.integrationId;
	const selectedChatPlatformName = selectedChat?.platformName;

	// Helper functions
	const createNewMessage = useCallback(
		(content: string): Message => {
			const currentUser = ensureAuth();
			return {
				id: `local-${Date.now()}-${Math.random()}`,
				content,
				sender: currentUser.customerId,
				timestamp: new Date().toISOString(),
				chatId: selectedChatId!,
				integrationId: selectedChatIntegrationId || "local",
				platformName: selectedChatPlatformName || "Local",
				messageType: "user",
				status: "pending",
			};
		},
		[selectedChatId, selectedChatIntegrationId, selectedChatPlatformName]
	);

	const updateMessageStatus = useCallback(
		(
			messages: Message[],
			messageId: string,
			status: "pending" | "sent" | "failed"
		) => {
			return messages.map((msg) =>
				msg.id === messageId ? { ...msg, status } : msg
			);
		},
		[]
	);

	const addMessageToCache = useCallback(
		(newMessage: Message) => {
			const updatedMessages = [...messages, newMessage];
			mutateMessages({ messages: updatedMessages }, false);
			return updatedMessages;
		},
		[messages, mutateMessages]
	);

	const updateCacheWithStatus = useCallback(
		(
			messages: Message[],
			messageId: string,
			status: "pending" | "sent" | "failed"
		) => {
			const updatedMessages = updateMessageStatus(messages, messageId, status);
			mutateMessages({ messages: updatedMessages }, false);
		},
		[updateMessageStatus, mutateMessages]
	);

	// Event handlers
	const handleRefresh = async () => {
		try {
			setIsRefreshing(true);
			await Promise.all([mutateMessages(), refreshChats()]);
		} catch (error) {
			console.error("Failed to refresh messages and chats:", error);
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleSync = async () => {
		console.log(
			"🔍 handleSync called with selectedIntegration:",
			selectedIntegration
		);
		console.log(
			"🔍 selectedIntegration?.connection?.id:",
			selectedIntegration?.connection?.id
		);
		console.log("🔍 selectedIntegration?.key:", selectedIntegration?.key);

		// Always open the sync dialog - it will handle app selection if needed
		console.log("📱 Opening sync dialog");
		setIsSyncDialogOpen(true);
	};

	const handleSyncSelectedChats = async (selectedChatIds: string[]) => {
		try {
			console.log("🚀 Syncing selected chats:", selectedChatIds);
			const integrationId = selectedIntegration?.connection?.id;
			const result = await syncMessages(integrationId, selectedChatIds);
			console.log("📊 Sync result:", result);
			await Promise.all([mutateMessages(), refreshChats()]);
			console.log("🔄 Data refreshed after sync");
		} catch (error) {
			console.error("💥 Failed to sync selected chats:", error);
			throw error;
		}
	};

	const handleSendMessage = useCallback(
		async (message: string) => {
			if (!selectedChatId) return;

			// Validate message
			const validation = validateMessage(message);
			if (!validation.isValid) {
				console.error("Message validation failed:", validation.error);
				return;
			}

			// Create and add message optimistically
			const newMessage = createNewMessage(message);
			const updatedMessages = addMessageToCache(newMessage);

			console.log("Sending message:", message, "to chat:", selectedChatId);

			// Send to third-party system
			try {
				const response = await sendMessageToThirdParty({
					message,
					chatId: selectedChatId,
					integrationId: selectedChatIntegrationId || "local",
					recipient: selectedChat?.participants?.[0] || selectedChatId,
					chatName: selectedChatName,
					chatType: "direct", // Default to direct, can be enhanced later
					platformName: selectedChatPlatformName,
					messageType: "text",
				});

				if (response.success) {
					// Update status immediately based on response
					updateCacheWithStatus(
						updatedMessages,
						newMessage.id,
						response.status || "sent"
					);
					console.log(
						`Message sent successfully with status: ${response.status}`
					);
				} else {
					updateCacheWithStatus(updatedMessages, newMessage.id, "failed");
					console.error("Failed to send message:", response.error);
				}
			} catch (error) {
				updateCacheWithStatus(updatedMessages, newMessage.id, "failed");
				console.error("Failed to send message to third-party system:", error);
			}
		},
		[
			selectedChatId,
			addMessageToCache,
			createNewMessage,
			selectedChat?.participants,
			selectedChatIntegrationId,
			selectedChatName,
			selectedChatPlatformName,
			updateCacheWithStatus,
		]
	);

	const handleRetryMessage = useCallback(
		async (messageId: string) => {
			if (!selectedChatId) return;

			// Find the message to retry
			const messageToRetry = messages.find((msg) => msg.id === messageId);
			if (!messageToRetry) {
				console.error("Message not found for retry:", messageId);
				return;
			}

			console.log(
				"Retrying message:",
				messageToRetry.content,
				"to chat:",
				selectedChatId
			);

			// Update message status to pending
			updateCacheWithStatus(messages, messageId, "pending");

			// Send to third-party system
			try {
				const response = await sendMessageToThirdParty({
					message: messageToRetry.content,
					chatId: selectedChatId,
					integrationId: selectedChatIntegrationId || "local",
					recipient: selectedChat?.participants?.[0] || selectedChatId,
					chatName: selectedChatName,
					chatType: "direct",
					platformName: selectedChatPlatformName,
					messageType: "text",
					messageId: messageId, // Pass the existing message ID for retry
				});

				if (response.success) {
					// Update status immediately based on response
					updateCacheWithStatus(messages, messageId, response.status || "sent");
					console.log(
						`Message retry successful with status: ${response.status}`
					);
				} else {
					updateCacheWithStatus(messages, messageId, "failed");
					console.error("Failed to retry message:", response.error);
				}
			} catch (error) {
				updateCacheWithStatus(messages, messageId, "failed");
				console.error("Failed to retry message:", error);
			}
		},
		[
			selectedChatId,
			selectedChat?.participants,
			selectedChatIntegrationId,
			selectedChatName,
			selectedChatPlatformName,
			updateCacheWithStatus,
			messages,
		]
	);

	// Filter messages by selected integration
	const filteredMessages = useMemo(() => {
		if (selectedIntegration) {
			return messages.filter(
				(message) =>
					message.integrationId === selectedIntegration.connection?.id
			);
		}
		return messages;
	}, [messages, selectedIntegration]);

	const uniquePlatformsCount = new Set(
		filteredMessages.map((m) => m.platformName).filter(Boolean)
	).size;

	// UI Components
	const HeaderSection = () => (
		<div className="flex justify-between items-center">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					{selectedIntegration
						? `${selectedIntegration.name} Messages`
						: "Messages"}
				</h1>
				<p className="text-muted-foreground">
					{selectedIntegration
						? `View and manage your messages from ${selectedIntegration.name}`
						: "View and manage your messages across all integrations"}
				</p>
				{selectedIntegration && (
					<Button
						onClick={() => setSelectedIntegration(null)}
						variant="ghost"
						size="sm"
						className="mt-2 text-gray-500 hover:text-gray-700"
					>
						<X className="w-4 h-4 mr-1" />
						Clear Filter
					</Button>
				)}
			</div>
			<div className="flex space-x-2">
				<Button
					onClick={handleSync}
					disabled={isSyncing}
					variant="outline"
					className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
					title={
						lastSyncTime
							? `Last synced: ${new Date(lastSyncTime).toLocaleString()}`
							: "No previous sync"
					}
				>
					{isSyncing ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Download className="mr-2 h-4 w-4" />
					)}
					{isSyncing
						? `Syncing... (${status})`
						: selectedIntegration
						? `Sync ${selectedIntegration.name}`
						: "Sync Messages"}
				</Button>

				{/* Error display */}
				{error && (
					<div className="text-red-600 dark:text-red-400 text-sm mt-2">
						Error: {error}
					</div>
				)}
				<Button
					onClick={handleRefresh}
					disabled={isRefreshing}
					variant="outline"
					className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
				>
					<RefreshCw
						className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
					/>
					{isRefreshing ? "Refreshing..." : "Refresh"}
				</Button>
			</div>
		</div>
	);

	const ChatViewSection = () => (
		<div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
			<ChatscopeChat
				messages={filteredMessages}
				selectedChatId={selectedChatId}
				isLoading={messagesLoading}
				onSendMessage={handleSendMessage}
				onRetryMessage={handleRetryMessage}
				selectedChatName={selectedChatName}
			/>
		</div>
	);

	const StatsSection = () => (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
			<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
				<div className="flex items-center">
					<MessageCircle className="h-8 w-8 text-blue-500" />
					<div className="ml-3">
						<p className="text-sm font-medium text-gray-500 dark:text-gray-400">
							Total Messages
						</p>
						<p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
							{filteredMessages.length}
						</p>
					</div>
				</div>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
				<div className="flex items-center">
					<MessageCircle className="h-8 w-8 text-green-500" />
					<div className="ml-3">
						<p className="text-sm font-medium text-gray-500 dark:text-gray-400">
							Active Chats
						</p>
						<p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
							{filteredChats.length}
						</p>
					</div>
				</div>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
				<div className="flex items-center">
					<MessageCircle className="h-8 w-8 text-purple-500" />
					<div className="ml-3">
						<p className="text-sm font-medium text-gray-500 dark:text-gray-400">
							Platforms
						</p>
						<p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
							{uniquePlatformsCount}
						</p>
					</div>
				</div>
			</div>
		</div>
	);

	// Main render
	return (
		<div className="flex h-[calc(100vh-40px)]">
			<Sidebar />
			<div className="flex-1 p-8">
				<div className="flex flex-col gap-4">
					<HeaderSection />

					{/* Main Content */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
						<ChatListSection
							chats={filteredChats}
							selectedChatId={selectedChatId}
							onChatSelect={setSelectedChatId}
							isLoading={chatsLoading}
							searchQuery={chatSearchQuery}
							onSearchChange={handleSearchChange}
						/>
						<ChatViewSection />
					</div>

					<StatsSection />
				</div>
			</div>

			{/* Sync Chats Dialog */}
			<SyncChatsDialog
				isOpen={isSyncDialogOpen}
				onClose={() => {
					console.log("🔒 Closing sync dialog");
					setIsSyncDialogOpen(false);
				}}
				integrationKey={
					selectedIntegration?.key || selectedIntegration?.connection?.id
				}
				integrationName={selectedIntegration?.name}
				onSyncSelected={handleSyncSelectedChats}
			/>
		</div>
	);
}
