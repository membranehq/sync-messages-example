import { Message } from "@/types/message";
import {
	MainContainer,
	ChatContainer,
	MessageList,
	Message as ChatscopeMessage,
	MessageInput,
} from "@chatscope/chat-ui-kit-react";
import { RefreshCw } from "lucide-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { useEffect, useRef } from "react";
import { MessageCircle, MessagesSquare } from "lucide-react";
import {
	getMessageSenderName,
	shouldShowSenderName,
	getMessageDisplayContent,
} from "@/lib/message-utils";

interface ChatscopeChatProps {
	messages: Message[];
	selectedChatId?: string;
	isLoading?: boolean;
	onSendMessage?: (message: string) => void;
	onRetryMessage?: (messageId: string) => void;
}

export function ChatscopeChat({
	messages,
	selectedChatId,
	isLoading,
	onSendMessage,
	onRetryMessage,
}: ChatscopeChatProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// Filter messages for the selected chat
	const chatMessages = selectedChatId
		? messages.filter((msg) => msg.chatId === selectedChatId)
		: [];

	// Convert our messages to chatscope format
	const chatscopeMessages = chatMessages.map((msg) => {
		const senderName = getMessageSenderName(msg);
		const displayContent = getMessageDisplayContent(msg.content);

		return {
			message: displayContent,
			sentTime: new Date(msg.timestamp).toLocaleTimeString(),
			sender: senderName,
			direction: (msg.messageType === "user" ? "outgoing" : "incoming") as
				| "outgoing"
				| "incoming",
			position: "single" as const,
			status: msg.status,
		};
	});

	// Find the last outgoing message index for status display
	const lastOutgoingIndex = chatscopeMessages
		.map((m, i) => ({ message: m, index: i }))
		.filter(({ message }) => message.direction === "outgoing")
		.pop()?.index;

	// Scroll to bottom when messages change
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Auto-scroll to bottom on initial load
	useEffect(() => {
		if (chatscopeMessages.length > 0) {
			scrollToBottom();
		}
	}, [chatscopeMessages.length]);

	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center h-full">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
					<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
						Loading messages...
					</p>
				</div>
			</div>
		);
	}

	if (
		!selectedChatId ||
		selectedChatId === undefined ||
		selectedChatId === ""
	) {
		return (
			<div className="flex-1 flex items-center justify-center h-full">
				<div className="text-center">
					<MessagesSquare className="mx-auto h-12 w-12 text-gray-400" />
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

	if (chatMessages.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center h-full">
				<div className="text-center">
					<MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
					<h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
						No messages found in chat
					</h3>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						This chat doesn&apos;t have any messages yet.
					</p>
				</div>
			</div>
		);
	}

	const handleSendMessage = (message: string) => {
		if (onSendMessage) {
			onSendMessage(message);
		}
	};

	return (
		<div style={{ position: "relative", height: "100%" }}>
			<MainContainer style={{ border: "none", borderRadius: "0" }}>
				<ChatContainer style={{ border: "none", borderRadius: "0" }}>
					<MessageList
						style={{
							maxHeight: "calc(100vh - 200px)",
							overflowY: "auto",
							paddingBottom: "5px",
						}}
					>
						{chatscopeMessages.map((msg, index) => {
							// Find the original message to get the ID for retry
							const originalMessage = chatMessages[index];

							// Check if this is the last outgoing message
							const isLastOutgoingMessage = lastOutgoingIndex === index;

							// Check if we should show the sender name
							const shouldShowName = shouldShowSenderName(
								chatscopeMessages,
								index
							);

							return (
								<div key={index} className="relative">
									{/* Show sender name for incoming messages (only when needed) */}
									{shouldShowName && (
										<div className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-4 mb-0 mt-5">
											{msg.sender}
										</div>
									)}
									<ChatscopeMessage model={msg} />
									{/* Status indicator and retry button only for the last outgoing message */}
									{msg.direction === "outgoing" &&
										msg.status &&
										isLastOutgoingMessage && (
											<div className="absolute -bottom-6 right-0 flex items-center space-x-2">
												<span
													className={`text-xs px-1.5 py-0.5 rounded-full ${
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
						<div ref={messagesEndRef} className="pb-4" />
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
