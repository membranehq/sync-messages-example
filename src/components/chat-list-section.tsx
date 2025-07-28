import { Chat } from "@/types/message";
import { MessageCircle } from "lucide-react";
import { memo } from "react";
import { ChatList } from "./chat-list";
import { ChatSearch } from "./chat-search";

interface ChatListSectionProps {
	chats: Chat[];
	selectedChatId?: string;
	onChatSelect: (chatId: string) => void;
	isLoading: boolean;
	searchQuery: string;
	onSearchChange: (value: string) => void;
}

export const ChatListSection = memo(function ChatListSection({
	chats,
	selectedChatId,
	onChatSelect,
	isLoading,
	searchQuery,
	onSearchChange,
}: ChatListSectionProps) {
	return (
		<div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full min-h-0">
			<div className="flex items-center space-x-2 p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
				<MessageCircle className="h-5 w-5 text-gray-500" />
				<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
					Chats ({chats.length})
				</h2>
			</div>

			{/* Search input */}
			<ChatSearch value={searchQuery} onChange={onSearchChange} />

			<div className="flex-1 overflow-y-auto p-4 min-h-0">
				<ChatList
					chats={chats}
					selectedChatId={selectedChatId}
					onChatSelect={onChatSelect}
					isLoading={isLoading}
					searchQuery={searchQuery}
				/>
			</div>
		</div>
	);
});
