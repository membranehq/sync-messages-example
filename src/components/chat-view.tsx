import { Message } from "@/types/message";
import { ChatMessage } from "./chat-message";
import { useEffect, useRef } from "react";
import { MessageCircle, Send } from "lucide-react";

interface ChatViewProps {
	messages: Message[];
	selectedChatId?: string;
	isLoading?: boolean;
	onSendMessage?: (message: string) => void;
}

export function ChatView({
	messages,
	selectedChatId,
	isLoading,
	onSendMessage,
}: ChatViewProps) {
	const messagesContainerRef = useRef<HTMLDivElement>(null);

	const scrollToTop = () => {
		if (messagesContainerRef.current) {
			messagesContainerRef.current.scrollTop = 0;
		}
	};

	useEffect(() => {
		scrollToTop();
	}, [messages]);

	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
					<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
						Loading messages...
					</p>
				</div>
			</div>
		);
	}

	if (!selectedChatId) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center">
					<MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
					<h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
						Select a chat
					</h3>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Choose a chat from the list to view messages.
					</p>
				</div>
			</div>
		);
	}

	if (messages.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center">
					<MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
					<h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
						No messages
					</h3>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						No messages found in this chat.
					</p>
				</div>
			</div>
		);
	}

	// Filter messages for the selected chat
	const chatMessages = messages.filter((msg) => msg.chatId === selectedChatId);

	return (
		<div className="flex-1 flex flex-col h-full">
			{/* Messages Container */}
			<div
				ref={messagesContainerRef}
				className="flex-1 overflow-y-auto p-4 space-y-4"
			>
				{chatMessages.map((message) => (
					<ChatMessage
						key={message.id}
						message={message}
						isOwnMessage={message.sender === "You"} // You can customize this logic
					/>
				))}
			</div>

			{/* Message Input (if onSendMessage is provided) */}
			{onSendMessage && (
				<div className="border-t border-gray-200 dark:border-gray-700 p-4">
					<div className="flex space-x-2">
						<input
							type="text"
							placeholder="Type a message..."
							className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
							onKeyPress={(e) => {
								if (e.key === "Enter" && e.currentTarget.value.trim()) {
									onSendMessage(e.currentTarget.value.trim());
									e.currentTarget.value = "";
								}
							}}
						/>
						<button
							onClick={(e) => {
								const input = e.currentTarget
									.previousElementSibling as HTMLInputElement;
								if (input.value.trim()) {
									onSendMessage(input.value.trim());
									input.value = "";
								}
							}}
							className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<Send className="h-4 w-4" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
