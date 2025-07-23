import { Message } from "@/types/message";
import { formatDistanceToNow } from "date-fns";

interface ChatMessageProps {
	message: Message;
	isOwnMessage?: boolean;
}

export function ChatMessage({
	message,
	isOwnMessage = false,
}: ChatMessageProps) {
	const formattedTime = (() => {
		try {
			const date = new Date(message.timestamp);
			if (isNaN(date.getTime())) {
				return "Unknown time";
			}
			return formatDistanceToNow(date, {
				addSuffix: true,
			});
		} catch (error) {
			console.error("Error formatting time:", message.timestamp, error);
			return "Unknown time";
		}
	})();

	return (
		<div
			className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}
		>
			<div
				className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
					isOwnMessage
						? "bg-blue-500 text-white"
						: "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
				}`}
			>
				<div className="flex items-center justify-between mb-1">
					<span className="text-sm font-medium">{message.sender}</span>
					<span className="text-xs opacity-70">{formattedTime}</span>
				</div>
				<p className="text-sm break-words">{message.content}</p>
				{message.platformName && (
					<div className="mt-1">
						<span className="text-xs opacity-60">
							via {message.platformName}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
