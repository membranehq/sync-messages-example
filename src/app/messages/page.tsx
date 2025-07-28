"use client";

import { useState, useCallback } from "react";
import { useMessages } from "@/hooks/use-messages";
import { useChats } from "@/hooks/use-chats";
import { useSyncMessages } from "@/hooks/use-sync-messages";
import { Message } from "@/types/message";
import { sendMessageToThirdParty, validateMessage } from "@/lib/message-api";
import { ensureAuth } from "@/lib/auth";
import { ChatList } from "@/components/chat-list";
import { ChatscopeChat } from "@/components/chatscope-chat";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageCircle, Download, Loader2 } from "lucide-react";

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

	// State
	const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Computed values
	const selectedChat = chats.find((chat) => chat.id === selectedChatId);
	const selectedChatName = selectedChat?.name;
	const selectedChatIntegrationId = selectedChat?.integrationId;
	const selectedChatPlatformName = selectedChat?.platformName;

	// Helper functions
	const createNewMessage = (content: string): Message => {
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
	};

	const updateMessageStatus = (
		messages: Message[],
		messageId: string,
		status: "pending" | "sent" | "failed"
	) => {
		return messages.map((msg) =>
			msg.id === messageId ? { ...msg, status } : msg
		);
	};

	const addMessageToCache = (newMessage: Message) => {
		const updatedMessages = [...messages, newMessage];
		mutateMessages({ messages: updatedMessages }, false);
		return updatedMessages;
	};

	const updateCacheWithStatus = (
		messages: Message[],
		messageId: string,
		status: "pending" | "sent" | "failed"
	) => {
		const updatedMessages = updateMessageStatus(messages, messageId, status);
		mutateMessages({ messages: updatedMessages }, false);
	};

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
		try {
			console.log("🚀 handleSync called");
			const result = await syncMessages();
			console.log("📊 Sync result:", result);
			await Promise.all([mutateMessages(), refreshChats()]);
			console.log("🔄 Data refreshed after sync");
		} catch (error) {
			console.error("💥 Failed to sync messages:", error);
			// Re-throw the error so the hook can properly handle it
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
					// Keep status as "pending" - webhook will update to "sent" or "failed"
					console.log(
						"Message flow started successfully, waiting for webhook confirmation"
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
					// Keep status as "pending" - webhook will update to "sent" or "failed"
					console.log(
						"Message retry flow started successfully, waiting for webhook confirmation"
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
		]
	);

	const uniquePlatformsCount = new Set(
		messages.map((m) => m.platformName).filter(Boolean)
	).size;

	// UI Components
	const HeaderSection = () => (
		<div className="flex justify-between items-center">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Messages</h1>
				<p className="text-muted-foreground">
					View and manage your messages across all integrations
				</p>
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
					{isSyncing ? `Syncing... (${status})` : "Sync Messages"}
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

	const ChatListSection = () => (
		<div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full">
			<div className="flex items-center space-x-2 p-4 border-b border-gray-200 dark:border-gray-700">
				<MessageCircle className="h-5 w-5 text-gray-500" />
				<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
					Chats
				</h2>
			</div>
			<div className="flex-1 overflow-y-auto p-4">
				<ChatList
					chats={chats}
					selectedChatId={selectedChatId}
					onChatSelect={setSelectedChatId}
					isLoading={chatsLoading}
				/>
			</div>
		</div>
	);

	const ChatViewSection = () => (
		<div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
			<ChatscopeChat
				messages={messages}
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
							{messages.length}
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
							{chats.length}
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
		<div className="container mx-auto py-10">
			<div className="flex flex-col gap-4">
				<HeaderSection />

				{/* Main Content */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
					<ChatListSection />
					<ChatViewSection />
				</div>

				<StatsSection />
			</div>
		</div>
	);
}
