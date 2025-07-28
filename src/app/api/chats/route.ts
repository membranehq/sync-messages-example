import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Chat } from "@/models/chat";
import { getAuthFromRequest } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
	try {
		const auth = getAuthFromRequest(request);
		if (!auth.customerId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await connectDB();

		// Fetch chats from MongoDB - include both user's chats and webhook chats (default customerId)
		const chats = await Chat.find({
			$or: [{ customerId: auth.customerId }, { customerId: "default" }],
		})
			.sort({ lastMessageTime: -1 })
			.limit(100); // Limit to prevent performance issues

		const chatsData = chats.map((chat) => ({
			id: chat.id,
			name: chat.name,
			participants: chat.participants,
			lastMessage: chat.lastMessage,
			lastMessageTime: chat.lastMessageTime,
			integrationId: chat.integrationId,
			platformName: chat.platformName,
		}));

		return NextResponse.json({ chats: chatsData }, { status: 200 });
	} catch (error) {
		console.error("Error fetching chats:", error);
		return NextResponse.json(
			{ error: "Failed to fetch chats" },
			{ status: 500 }
		);
	}
}
