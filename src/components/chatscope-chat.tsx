import { Message } from "@/types/message";
import {
	MainContainer,
	ChatContainer,
	MessageList,
	Message as ChatscopeMessage,
	MessageInput,
	ConversationHeader,
	Avatar,
} from "@chatscope/chat-ui-kit-react";
import { RefreshCw } from "lucide-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";

interface ChatscopeChatProps {
	messages: Message[];
	selectedChatId?: string;
	isLoading?: boolean;
	onSendMessage?: (message: string) => void;
	onRetryMessage?: (messageId: string) => void;
	selectedChatName?: string;
}

export function ChatscopeChat({
	messages,
	selectedChatId,
	isLoading,
	onSendMessage,
	onRetryMessage,
	selectedChatName,
}: ChatscopeChatProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

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

	// Convert our messages to chatscope format
	const chatscopeMessages = chatMessages.map((msg) => ({
		message: msg.content,
		sentTime: new Date(msg.timestamp).toLocaleTimeString(),
		sender: msg.sender,
		direction: (msg.messageType === "user" ? "outgoing" : "incoming") as
			| "outgoing"
			| "incoming",
		position: "single" as const,
		status: msg.status, // Add status to the message
	}));

	// Scroll to bottom when messages change
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Auto-scroll to bottom on initial load
	useEffect(() => {
		if (chatscopeMessages.length > 0) {
			scrollToBottom();
		}
	}, []);

	const handleSendMessage = (message: string) => {
		if (onSendMessage) {
			onSendMessage(message);
		}
	};

	return (
		<div style={{ position: "relative", height: "100%" }}>
			<MainContainer>
				<ChatContainer>
					<ConversationHeader>
						<ConversationHeader.Content>
							<div className="ml-3">
								<div className="text-sm font-medium text-gray-900 dark:text-gray-100">
									{selectedChatName || "Chat"}
								</div>
							</div>
						</ConversationHeader.Content>
					</ConversationHeader>
					<MessageList
						style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}
					>
						{chatscopeMessages.map((msg, index) => {
							// Find the original message to get the ID for retry
							const originalMessage = chatMessages[index];

							return (
								<div key={index} className="relative">
									<ChatscopeMessage model={msg} />
									{/* Status indicator and retry button for outgoing messages */}
									{msg.direction === "outgoing" && msg.status && (
										<div className="absolute -bottom-6 right-0 flex items-center space-x-2">
											<span
												className={`text-xs px-1.5 py-0.5 rounded-full text-xs ${
													msg.status === "pending"
														? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
														: msg.status === "sent"
														? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
														: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
												}`}
											>
												{msg.status === "pending"
													? "Pending"
													: msg.status === "sent"
													? "Sent"
													: "Failed"}
											</span>

											{/* Retry icon for failed messages */}
											{msg.status === "failed" && onRetryMessage && (
												<button
													onClick={() => onRetryMessage(originalMessage.id)}
													className="text-xs p-1 text-red-500 hover:text-red-700 transition-colors"
													title="Retry sending message"
												>
													<RefreshCw className="h-3 w-3" />
												</button>
											)}
										</div>
									)}
								</div>
							);
						})}
						<div ref={messagesEndRef} />
					</MessageList>
					{onSendMessage && (
						<MessageInput
							placeholder="Type message here"
							onSend={handleSendMessage}
							attachButton={false}
						/>
					)}
				</ChatContainer>
			</MainContainer>
		</div>
	);
}
