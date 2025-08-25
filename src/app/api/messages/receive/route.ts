import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Message } from "@/models/message";
import { Chat } from "@/models/chat";
import { UserPlatform } from "@/models/user-platform";
import { getIntegrationClient } from "@/lib/integration-app-client";
import type { AuthCustomer } from "@/lib/auth";

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

interface ChatRecord {
	id?: string;
	name?: string;
	title?: string;
	subject?: string;
	fields?: {
		id?: string;
		name?: string;
	};
	rawFields?: {
		id?: string;
		name?: string;
	};
}

// Function to get chat name from available chats
async function getChatName(
	chatId: string,
	integrationId: string,
	auth: AuthCustomer
): Promise<string> {
	try {
		const client = await getIntegrationClient(auth);

		// Get available chats from the integration
		const chatsResult = await client
			.connection(integrationId)
			.action("get-chats")
			.run({
				cursor: "", // Start from beginning
			});

		if (chatsResult.output?.records) {
			const chat = chatsResult.output.records.find(
				(chat: ChatRecord) =>
					chat.id === chatId ||
					chat.fields?.id === chatId ||
					chat.rawFields?.id === chatId
			);

			if (chat) {
				const chatName =
					chat.fields?.name ||
					chat.rawFields?.name ||
					chat.name ||
					chat.title ||
					chat.subject ||
					"Unnamed Chat";

				console.log(`✅ Found chat name for ${chatId}: ${chatName}`);
				return chatName;
			}
		}
	} catch (error) {
		console.error(`❌ Error fetching chat name for ${chatId}:`, error);
	}

	// Fallback to generic name if we can't fetch the real name
	return `Chat ${chatId}`;
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
		const { id, content, ownerId, ownerName, chatId, timestamp, platformName } =
			data;

		// Ensure platformName has a value
		const actualPlatformName = platformName || "Unknown";

		// Look up the integration information from UserPlatform using customerId and platformName
		const userPlatform = await UserPlatform.findOne({
			customerId: customerId,
			platformName: actualPlatformName,
		});

		// Use the connectionId from UserPlatform as the integrationId
		let actualIntegrationId = "unknown";
		if (userPlatform) {
			actualIntegrationId = userPlatform.connectionId;
			console.log(
				`✅ Found UserPlatform record for ${actualPlatformName}: connectionId = ${actualIntegrationId}`
			);
		} else {
			console.log(
				`⚠️ No UserPlatform record found for customerId: ${customerId}, platformName: ${actualPlatformName}`
			);
			// Fallback to platformName.toLowerCase() if no UserPlatform record exists
			actualIntegrationId = actualPlatformName.toLowerCase();
		}

		console.log(
			`🔍 Using integration ID: ${actualIntegrationId} for platform: ${actualPlatformName}`
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

		// Check if we already have this message by externalMessageId and customerId
		const existingMessage = await Message.findOne({
			externalMessageId: externalMessageId,
			customerId: customerId,
		});

		if (existingMessage) {
			console.log(
				`Message with externalMessageId ${externalMessageId} already exists for customer ${customerId}, skipping import`
			);
			return NextResponse.json({
				success: true,
				message: "Message already exists for this customer",
			});
		}

		// Find or create the chat
		let chat = await Chat.findOne({ id: chatId, customerId });
		if (!chat) {
			// Use the userPlatform we already found above, or do a fallback lookup
			let importNewEnabled = true; // Default to true

			if (userPlatform) {
				importNewEnabled = userPlatform.importNew;
			} else {
				// Fallback lookup using platformName
				const fallbackUserPlatform = await UserPlatform.findOne({
					platformId: actualPlatformName.toLowerCase(),
					customerId: customerId,
				});
				importNewEnabled = fallbackUserPlatform
					? fallbackUserPlatform.importNew
					: true;
			}

			if (!importNewEnabled) {
				console.log(
					`❌ Chat ${chatId} not found and importNew is disabled for platform ${actualPlatformName}`
				);
				return NextResponse.json(
					{
						success: false,
						message: "Chat not found and automatic import is disabled",
					},
					{ status: 404 }
				);
			}

			// Get the actual chat name from the integration
			const chatName = await getChatName(chatId, actualIntegrationId, {
				customerId,
				customerName: null,
			});

			// Create a new chat if importNew is enabled
			chat = await Chat.create({
				id: chatId,
				name: chatName,
				platformName: actualPlatformName,
				integrationId: actualIntegrationId,
				lastMessage: content,
				lastMessageTime: formattedTimestamp,
				participants: [ownerId],
				customerId,
				importNew: true, // Set importNew to true for new chats
			});
			console.log(
				`✅ Created new chat with importNew enabled: ${chatId} (${chatName})`
			);
		} else {
			// Update chat with latest message info and fix integrationId if needed
			const updateData: {
				lastMessage: string;
				lastMessageTime: string;
				updatedAt: Date;
				integrationId?: string;
				platformName?: string;
				name?: string;
			} = {
				lastMessage: content,
				lastMessageTime: formattedTimestamp,
				updatedAt: new Date(),
			};

			// Fix integrationId if it's "unknown" or doesn't match
			if (
				chat.integrationId === "unknown" ||
				chat.integrationId !== actualIntegrationId
			) {
				console.log(
					`🔧 Fixing chat integrationId from "${chat.integrationId}" to "${actualIntegrationId}"`
				);
				updateData.integrationId = actualIntegrationId;
				updateData.platformName = actualPlatformName;

				// Also update the chat name if we're fixing the integration
				const chatName = await getChatName(chatId, actualIntegrationId, {
					customerId,
					customerName: null,
				});
				updateData.name = chatName;
			}

			await Chat.findOneAndUpdate({ id: chatId, customerId }, updateData);
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
			platformName: actualPlatformName,
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
