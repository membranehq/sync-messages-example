import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Message } from "@/models/message";
import { Chat } from "@/models/chat";
import { UserPlatform } from "@/models/user-platform";

interface IncomingMessagePayload {
	externalMessageId: string;
	customerId: string;
	data: {
		id: string;
		content: string;
		ownerId: string;
		ownerName?: string;
		chatId: string;
		timestamp?: string;
		platformName?: string;
		integrationId?: string;
	};
}

export async function POST(request: NextRequest) {
	try {
		// For webhooks, we need to handle Integration.app's authentication
		const integrationAppToken = request.headers.get("X-Integration-App-Token");

		if (!integrationAppToken) {
			console.error("No Integration.app token provided in webhook");
			return NextResponse.json(
				{ error: "Unauthorized - No token" },
				{ status: 401 }
			);
		}

		// For now, we'll accept any valid Integration.app token
		// In production, you might want to validate this token
		console.log(
			"Integration.app incoming message webhook received with token:",
			integrationAppToken.substring(0, 20) + "..."
		);

		const body: IncomingMessagePayload = await request.json();
		const { externalMessageId, customerId, data } = body;

		console.log(
			`Incoming message webhook received: ${externalMessageId} from ${data.ownerId} in chat ${data.chatId}`
		);

		await connectDB();

		// Extract data from the payload
		const {
			id,
			content,
			ownerId,
			ownerName,
			chatId,
			timestamp,
			platformName = "Unknown",
			integrationId = "unknown",
		} = data;

		// Use the provided integrationId or fallback to platformName
		let actualIntegrationId =
			integrationId !== "unknown" ? integrationId : platformName.toLowerCase();

		console.log(
			`🔍 Using integration ID: ${actualIntegrationId} for platform: ${platformName}`
		);

		// Generate a unique message ID if not provided
		const messageId = id || `msg-${Date.now()}-${Math.random()}`;

		// Format timestamp - convert Unix timestamp to ISO string if needed
		let formattedTimestamp;
		if (timestamp) {
			// Check if it's a Unix timestamp (numeric string)
			if (/^\d+\.?\d*$/.test(timestamp)) {
				// Convert Unix timestamp to ISO string
				const unixTime = parseFloat(timestamp);
				formattedTimestamp = new Date(unixTime * 1000).toISOString();
			} else {
				// Assume it's already an ISO string
				formattedTimestamp = timestamp;
			}
		} else {
			formattedTimestamp = new Date().toISOString();
		}

		console.log(`Raw timestamp: ${timestamp}`);
		console.log(`Formatted timestamp: ${formattedTimestamp}`);

		// Check if we already have this message by externalMessageId
		const existingMessage = await Message.findOne({
			externalMessageId: externalMessageId,
		});

		if (existingMessage) {
			console.log(
				`Message with externalMessageId ${externalMessageId} already exists, skipping import`
			);
			return NextResponse.json({
				success: true,
				message: "Message already exists",
			});
		}

		// Find or create the chat
		let chat = await Chat.findOne({ id: chatId, customerId });
		if (!chat) {
			// Check if this platform has importNew enabled
			const userPlatform = await UserPlatform.findOne({
				platformId: actualIntegrationId, // Use the standardized platformId
				customerId: customerId,
			});

			// Default to true if no UserPlatform record exists (new connection)
			// Only false if explicitly set to false
			const importNewEnabled = userPlatform ? userPlatform.importNew : true;

			if (!importNewEnabled) {
				console.log(
					`❌ Chat ${chatId} not found and importNew is disabled for platform ${actualIntegrationId}`
				);
				return NextResponse.json(
					{
						success: false,
						message: "Chat not found and automatic import is disabled",
					},
					{ status: 404 }
				);
			}

			// Create a new chat if importNew is enabled
			chat = await Chat.create({
				id: chatId,
				name: `Chat ${chatId}`,
				platformName: platformName,
				integrationId: actualIntegrationId,
				lastMessage: content,
				lastMessageTime: formattedTimestamp,
				participants: [ownerId],
				customerId,
				importNew: true, // Set importNew to true for new chats
			});
			console.log(`✅ Created new chat with importNew enabled: ${chatId}`);
		} else {
			// Update chat with latest message info
			await Chat.findOneAndUpdate(
				{ id: chatId, customerId },
				{
					lastMessage: content,
					lastMessageTime: formattedTimestamp,
					updatedAt: new Date(),
				}
			);
		}

		// Save the incoming message to MongoDB
		const newMessage = await Message.create({
			id: messageId,
			content: content,
			sender: ownerId,
			ownerName: ownerName,
			timestamp: formattedTimestamp,
			chatId: chatId,
			integrationId: actualIntegrationId,
			platformName: platformName,
			messageType: "third-party", // Mark as incoming message
			externalMessageId: externalMessageId,
			status: "sent", // Incoming messages are already sent on the external platform
			customerId,
		});

		console.log(
			`✅ Incoming message saved: ${content.substring(
				0,
				50
			)}... from ${ownerId} in ${chatId}`
		);

		return NextResponse.json({
			success: true,
			messageId: newMessage.id,
			chatId: chatId,
			externalMessageId: externalMessageId,
		});
	} catch (error) {
		console.error("Error processing incoming message webhook:", error);
		return NextResponse.json(
			{ error: "Failed to process incoming message" },
			{ status: 500 }
		);
	}
}
