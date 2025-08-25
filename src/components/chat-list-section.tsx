import { ChatList } from "./chat-list";
import { ChatSearch } from "./chat-search";
import type { Chat } from "@/types/message";
import { MessageCircle } from "lucide-react";

interface ChatListSectionProps {
	chats: Chat[];
	selectedChatId: string | null;
	onChatSelect: (chatId: string) => void;
	onChatDelete?: (chatId: string, chatName: string) => void;
	onSyncChats?: () => void;
	isSyncing?: boolean;
	isLoading?: boolean;
	searchQuery?: string;
	onSearchChange?: (value: string) => void;
	selectedIntegrationKey?: string | undefined;
	isDisabled?: boolean;
	status?: string;
}

export function ChatListSection({
	chats,
	selectedChatId,
	onChatSelect,
	onChatDelete,
	onSyncChats,
	isSyncing = false,
	isLoading = false,
	searchQuery = "",
	onSearchChange,
	selectedIntegrationKey,
	isDisabled = false,
	status,
}: ChatListSectionProps) {
	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full min-h-0">
			{/* Header */}
			<div className="flex items-center space-x-2 p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
				<MessageCircle className="h-5 w-5 text-gray-500" />
				<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
					Chats ({chats.length})
				</h2>
			</div>

			{/* Search */}
			<div className="p-1 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
				<ChatSearch
					value={searchQuery}
					onChange={onSearchChange || (() => {})}
				/>
			</div>

			{/* Chat List */}
			<div className="flex-1 overflow-y-auto p-4 min-h-0">
				<ChatList
					chats={chats}
					selectedChatId={selectedChatId}
					onChatSelect={onChatSelect}
					onChatDelete={onChatDelete}
					onSyncChats={onSyncChats}
					isSyncing={isSyncing}
					isLoading={isLoading}
					searchQuery={searchQuery}
					selectedIntegrationKey={selectedIntegrationKey}
					isDisabled={isDisabled}
					status={status}
				/>
			</div>
		</div>
	);
}
