import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Message } from "@/models/message";
import { getAuthFromRequest } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
	try {
		const auth = getAuthFromRequest(request);
		if (!auth.customerId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await connectDB();

		// Fetch messages from MongoDB - include both user's messages and webhook messages (default customerId)
		const messages = await Message.find({
			$or: [{ customerId: auth.customerId }, { customerId: "default" }],
		})
			.sort({ timestamp: 1 })
			.limit(1000); // Limit to prevent performance issues

		const messagesData = messages.map((msg) => ({
			id: msg.id,
			content: msg.content,
			sender: msg.sender,
			ownerName: msg.ownerName,
			timestamp: msg.timestamp,
			chatId: msg.chatId,
			integrationId: msg.integrationId,
			platformName: msg.platformName,
			messageType: msg.messageType,
			status: msg.status,
		}));

		return NextResponse.json({ messages: messagesData }, { status: 200 });
	} catch (error) {
		console.error("Error fetching messages:", error);
		return NextResponse.json(
			{ error: "Failed to fetch messages" },
			{ status: 500 }
		);
	}
}
