export interface Message {
	id: string;
	content: string;
	sender: string;
	timestamp: string;
	chatId?: string;
	integrationId: string;
	platformName?: string;
}

export interface Chat {
	id: string;
	name: string;
	participants: string[];
	lastMessage?: string;
	lastMessageTime?: string;
	integrationId: string;
	platformName?: string;
}

export interface MessagesResponse {
	messages: Message[];
}

export interface ChatsResponse {
	chats: Chat[];
}
