import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Message } from "@/models/message";
import { getAuthFromRequest } from "@/lib/server-auth";
import { getIntegrationClient } from "@/lib/integration-app-client";

interface SendMessageRequest {
	message: string;
	chatId: string;
	integrationId: string;
	recipient?: string;
	chatName?: string;
	chatType?: "direct" | "group" | "channel";
	platformName?: string;
	messageType?: "text" | "image" | "file" | "reaction" | "system";
	messageId?: string; // Optional: for retrying existing messages
}

export async function POST(request: NextRequest) {
	try {
		const auth = getAuthFromRequest(request);
		if (!auth.customerId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body: SendMessageRequest = await request.json();
		const {
			message,
			chatId,
			integrationId,
			recipient,
			chatName,
			chatType,
			platformName,
			messageType = "text",
			messageId, // For retrying existing messages
		} = body;

		// Validate required fields
		if (!message || !chatId || !integrationId) {
			return NextResponse.json(
				{ error: "Missing required fields: message, chatId, integrationId" },
				{ status: 400 }
			);
		}

		await connectDB();

		// Get Integration.app client
		const client = await getIntegrationClient(auth);

		try {
			// Step 1: Run the flow to send message
			console.log(`Running flow to send message to chat ${chatId}`);

			// Check if this is a retry of an existing message
			const isRetry = !!messageId;
			const internalMessageId =
				messageId || `msg-${Date.now()}-${Math.random()}`;

			// Prepare the input data according to the required structure
			const input = {
				type: "created", // Always send as "created" type, even for retries
				data: {
					content: message,
					sender: auth.customerId, // Using customerId as sender for now
					recipient: recipient || chatId, // Use recipient if provided, otherwise use chatId
					chatId: chatId,
					chatName: chatName || "Chat",
					chatType: chatType || "direct",
					platformId: integrationId,
					platformName: platformName || "Unknown",
					messageType: messageType,
					status: "pending",
					sentTime: new Date().toISOString(),
					createdTime: new Date().toISOString(),
					createdBy: auth.customerId,
					updatedTime: new Date().toISOString(),
					updatedBy: auth.customerId,
				},
				customerId: auth.customerId,
				internalMessageId: internalMessageId,
				externalMessageId: "", // Will be filled by the flow
			};

			const result = await client
				.connection(integrationId)
				.action("create-messages")
				.run(input);

			console.log(`Message sent successfully via action:`, result);

			// Extract external message ID and status from the action result
			const externalMessageId =
				result?.output?.messageId || result?.output?.id || "";
			const actionStatus = result?.output?.status || "completed";
			const isSuccess =
				actionStatus === "completed" || actionStatus === "success";

			// Determine message status based on action result
			const messageStatus = isSuccess ? "sent" : "failed";
			const errorMessage = isSuccess ? "" : "Action execution failed";

			console.log(`Action result:`, {
				status: actionStatus,
				isSuccess,
				messageStatus,
				externalMessageId,
				error: errorMessage,
			});

			// Step 2: Save or update message in MongoDB with appropriate status
			const messageToSave = {
				id: internalMessageId,
				content: message,
				sender: auth.customerId, // Use customerId for proper user tracking
				timestamp: new Date().toISOString(),
				chatId: chatId,
				integrationId: integrationId,
				platformName: platformName || "Unknown",
				messageType: "user" as const, // Mark as user message
				status: messageStatus, // Set status based on action result
				externalMessageId: externalMessageId, // Save the external message ID
				error: errorMessage, // Save error message if failed
			};

			let savedMessage;
			if (isRetry) {
				// Update existing message for retry
				savedMessage = await Message.findOneAndUpdate(
					{ id: internalMessageId, customerId: auth.customerId },
					{
						...messageToSave,
						customerId: auth.customerId,
						updatedAt: new Date(),
					},
					{ new: true }
				);
				console.log(`Message updated in MongoDB with ID: ${savedMessage?.id}`);
			} else {
				// Create new message
				savedMessage = await Message.create({
					...messageToSave,
					customerId: auth.customerId,
				});
				console.log(`Message saved to MongoDB with ID: ${savedMessage.id}`);
			}

			// Step 3: Return immediately with actual status
			// Since it's synchronous, we know the result immediately
			return NextResponse.json({
				success: isSuccess,
				messageId: savedMessage.id,
				status: messageStatus,
				externalMessageId: externalMessageId,
			});
		} catch (actionError) {
			console.error("Error running action:", actionError);
			return NextResponse.json({
				success: false,
				error: "Failed to execute action",
			});
		}
	} catch (error) {
		console.error("Error sending message:", error);
		return NextResponse.json(
			{ error: "Failed to send message" },
			{ status: 500 }
		);
	}
}
