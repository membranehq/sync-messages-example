"use client";

import { useState } from "react";
import { useMessages } from "@/hooks/use-messages";
import { useChats } from "@/hooks/use-chats";
import { useSyncMessages } from "@/hooks/use-sync-messages";
import { ChatList } from "@/components/chat-list";
import { ChatView } from "@/components/chat-view";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageCircle, Download } from "lucide-react";

export default function MessagesPage() {
	const {
		messages,
		isLoading: messagesLoading,
		mutate: refreshMessages,
	} = useMessages();
	const { chats, isLoading: chatsLoading, mutate: refreshChats } = useChats();
	const { syncMessages } = useSyncMessages();
	const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);

	const handleRefresh = async () => {
		try {
			setIsRefreshing(true);
			await Promise.all([refreshMessages(), refreshChats()]);
		} catch (error) {
			console.error("Failed to refresh messages and chats:", error);
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleSync = async () => {
		try {
			setIsSyncing(true);
			const result = await syncMessages();
			console.log("Sync result:", result);
			// Refresh the data after sync
			await Promise.all([refreshMessages(), refreshChats()]);
		} catch (error) {
			console.error("Failed to sync messages:", error);
		} finally {
			setIsSyncing(false);
		}
	};

	const handleSendMessage = async (message: string) => {
		// This would typically send a message to the selected chat
		// For now, we'll just log it
		console.log("Sending message:", message, "to chat:", selectedChatId);
		// You can implement actual message sending here
	};

	return (
		<div className="container mx-auto py-10">
			<div className="flex flex-col gap-4">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Messages</h1>
						<p className="text-muted-foreground">
							View and manage your messages across all integrations
						</p>
					</div>
					<div className="flex space-x-2">
						<Button onClick={handleSync} disabled={isSyncing}>
							<Download
								className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
							/>
							{isSyncing ? "Syncing..." : "Sync Messages"}
						</Button>
						<Button onClick={handleRefresh} disabled={isRefreshing}>
							<RefreshCw
								className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
							/>
							{isRefreshing ? "Refreshing..." : "Refresh"}
						</Button>
					</div>
				</div>

				{/* Main Content */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
					{/* Chat List Sidebar */}
					<div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
						<div className="flex items-center space-x-2 mb-4">
							<MessageCircle className="h-5 w-5 text-gray-500" />
							<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
								Chats
							</h2>
						</div>
						<div className="h-full overflow-y-auto">
							<ChatList
								chats={chats}
								selectedChatId={selectedChatId}
								onChatSelect={setSelectedChatId}
								isLoading={chatsLoading}
							/>
						</div>
					</div>

					{/* Chat View */}
					<div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
						<ChatView
							messages={messages}
							selectedChatId={selectedChatId}
							isLoading={messagesLoading}
							onSendMessage={handleSendMessage}
						/>
					</div>
				</div>

				{/* Stats */}
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
									{
										new Set(messages.map((m) => m.platformName).filter(Boolean))
											.size
									}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
