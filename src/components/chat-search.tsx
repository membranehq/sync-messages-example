import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { memo } from "react";

interface ChatSearchProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

export const ChatSearch = memo(function ChatSearch({
	value,
	onChange,
	placeholder = "Search chats...",
}: ChatSearchProps) {
	return (
		<div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
				<Input
					type="text"
					placeholder={placeholder}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="pl-10 pr-8 py-2 text-sm"
				/>
				{value && (
					<button
						onClick={() => onChange("")}
						className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>
		</div>
	);
});
