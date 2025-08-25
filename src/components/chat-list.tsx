import { MessageCircle, Trash2 } from "lucide-react";
import type { Chat } from "@/types/message";
import { SyncButton } from "./sync-button";

interface ChatListProps {
	chats: Chat[];
	selectedChatId: string | null;
	onChatSelect: (chatId: string) => void;
	onChatDelete?: (chatId: string, chatName: string) => void;
	onSyncChats?: () => void;
	isSyncing?: boolean;
	isLoading?: boolean;
	searchQuery?: string;
	selectedIntegrationKey?: string | undefined;
	isDisabled?: boolean;
	status?: string;
}

export const ChatList = function ChatList({
	chats,
	selectedChatId,
	onChatSelect,
	onChatDelete,
	onSyncChats,
	isSyncing = false,
	isLoading = false,
	searchQuery = "",
	selectedIntegrationKey,
	isDisabled,
	status,
}: ChatListProps) {
	if (isLoading) {
		return (
			<div className="text-center py-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
				<p className="text-sm text-gray-500 dark:text-gray-400">
					Loading chats...
				</p>
			</div>
		);
	}

	if (chats.length === 0) {
		return (
			<div className="text-center py-8">
				<MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
				<h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
					{searchQuery ? "No chats match your search" : "No chats imported"}
				</h3>
				<p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
					{searchQuery
						? "Try adjusting your search terms or clear the search."
						: "Import chats from your connected messaging platforms to see them here."}
				</p>
				{!searchQuery && onSyncChats && selectedIntegrationKey && (
					<SyncButton
						integrationKey={selectedIntegrationKey}
						onSync={onSyncChats}
						status={status}
						isSyncing={isSyncing}
						isDisabled={isDisabled}
					/>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{chats.map((chat) => (
				<div
					key={chat.id}
					className={`group relative p-4 rounded-lg cursor-pointer transition-colors ${
						selectedChatId === chat.id
							? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
							: "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
					}`}
					onClick={() => onChatSelect(chat.id)}
				>
					{/* Delete button - appears on hover */}
					{onChatDelete && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								onChatDelete(chat.id, chat.name);
							}}
							className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
							title="Delete chat"
						>
							<Trash2 className="w-4 h-4" />
						</button>
					)}

					<div className="flex items-start justify-between">
						<div className="flex-1 min-w-0">
							<div className="flex items-center space-x-2">
								<MessageCircle className="h-4 w-4 text-gray-400" />
								<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
									{chat.name}
								</h3>
							</div>

							{chat.lastMessage && (
								<p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
									{chat.lastMessage}
								</p>
							)}
						</div>

						{chat.lastMessageTime &&
							(() => {
								try {
									const date = new Date(chat.lastMessageTime);
									if (isNaN(date.getTime())) {
										return null;
									}
									return (
										<div className="text-xs text-gray-400 ml-2">
											{/* The original code used date-fns, but it was removed.
												Assuming a placeholder or that the user intends to re-add it.
												For now, keeping the original structure but noting the missing import. */}
											{/* {formatDistanceToNow(date, {
												addSuffix: true,
											})} */}
											{chat.lastMessageTime}
										</div>
									);
								} catch (error) {
									console.error(
										"Error formatting chat time:",
										chat.lastMessageTime,
										error
									);
									return null;
								}
							})()}
					</div>

					{chat.platformName && (
						<div className="mt-2">
							<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
								{chat.platformName}
							</span>
						</div>
					)}
				</div>
			))}
		</div>
	);
};
