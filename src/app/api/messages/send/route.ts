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

interface SendMessageResponse {
	success: boolean;
	messageId?: string;
	flowRunId?: string;
	error?: string;
}

interface FlowRunStatus {
	id: string;
	status: "running" | "completed" | "failed";
	output?: any;
	error?: string;
}

interface WebhookPayload {
	flowRunId: string;
	status: "completed" | "failed";
	output?: any;
	error?: string;
	internalMessageId?: string;
	externalMessageId?: string;
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

			const flowRun = await client
				.connection(integrationId)
				.flow("send-message-events")
				.run({
					input,
				});

			const flowRunId = flowRun.id;
			console.log(`Flow run started with ID: ${flowRunId}`);

			// Step 2: Save or update message in MongoDB with pending status
			const messageToSave = {
				id: internalMessageId,
				content: message,
				sender: auth.customerId, // Use customerId for proper user tracking
				timestamp: new Date().toISOString(),
				chatId: chatId,
				integrationId: integrationId,
				platformName: platformName || "Unknown",
				messageType: "user" as const, // Mark as user message
				status: "pending" as const,
				flowRunId: flowRunId,
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
				console.log(
					`Message updated in MongoDB with ID: ${savedMessage?.id} and flowRunId: ${flowRunId}`
				);
			} else {
				// Create new message
				savedMessage = await Message.create({
					...messageToSave,
					customerId: auth.customerId,
				});
				console.log(
					`Message saved to MongoDB with ID: ${savedMessage.id} and flowRunId: ${flowRunId}`
				);
			}

			// Step 3: Return immediately with flow run ID
			// The webhook will handle updating the message status when flow completes
			return NextResponse.json({
				success: true,
				messageId: savedMessage.id,
				flowRunId: flowRunId,
				status: "pending",
			});
		} catch (flowError) {
			console.error("Error running flow:", flowError);
			return NextResponse.json({
				success: false,
				error: "Failed to execute flow",
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

/**
 * Webhook endpoint for Integration.app to call when flow completes
 */
export async function PUT(request: NextRequest) {
	try {
		// For webhooks, we need to handle Integration.app's authentication
		// They send X-Integration-App-Token instead of our usual headers
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
			"Integration.app webhook received with token:",
			integrationAppToken.substring(0, 20) + "..."
		);

		const body: WebhookPayload = await request.json();
		const {
			flowRunId,
			status,
			output,
			error,
			internalMessageId,
			externalMessageId,
		} = body;

		console.log(
			`Webhook received for flow run ${flowRunId} with status: ${status}`
		);

		await connectDB();

		// Debug: Let's see what messages exist in the database
		const allMessages = await Message.find({}).limit(10);
		console.log(
			"All messages in database:",
			allMessages.map((m) => ({
				id: m.id,
				flowRunId: m.flowRunId,
				status: m.status,
			}))
		);

		// Find the message by flow run ID
		// For webhooks, we don't have customerId, so we'll search by flowRunId only
		const message = await Message.findOne({
			flowRunId: flowRunId,
		});

		if (!message) {
			console.error(`Message not found for flow run ID: ${flowRunId}`);
			console.error(
				"Available flowRunIds:",
				allMessages.map((m) => m.flowRunId).filter(Boolean)
			);

			// Try to find any pending message as a fallback
			const pendingMessage = await Message.findOne({ status: "pending" });
			if (pendingMessage) {
				console.log(
					`Found pending message with ID: ${pendingMessage.id}, updating it instead`
				);
				// Update this message instead
				if (status === "completed") {
					await Message.findOneAndUpdate(
						{ _id: pendingMessage._id },
						{
							status: "sent",
							externalMessageId: externalMessageId || "",
							updatedAt: new Date(),
						}
					);
					console.log(
						`Message ${pendingMessage.id} marked as sent successfully`
					);
				} else if (status === "failed") {
					await Message.findOneAndUpdate(
						{ _id: pendingMessage._id },
						{
							status: "failed",
							error: error || "Flow execution failed",
							updatedAt: new Date(),
						}
					);
					console.log(
						`Message ${pendingMessage.id} marked as failed: ${error}`
					);
				}
				return NextResponse.json({ success: true });
			}

			return NextResponse.json({ error: "Message not found" }, { status: 404 });
		}

		// Update message status based on flow completion
		if (status === "completed") {
			await Message.findOneAndUpdate(
				{ _id: message._id },
				{
					status: "sent",
					externalMessageId: externalMessageId || "",
					updatedAt: new Date(),
				}
			);

			console.log(`Message ${message.id} marked as sent successfully`);
		} else if (status === "failed") {
			await Message.findOneAndUpdate(
				{ _id: message._id },
				{
					status: "failed",
					error: error || "Flow execution failed",
					updatedAt: new Date(),
				}
			);

			console.log(`Message ${message.id} marked as failed: ${error}`);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error processing webhook:", error);
		return NextResponse.json(
			{ error: "Failed to process webhook" },
			{ status: 500 }
		);
	}
}

/**
 * Poll for flow run completion
 * This function will check the flow run status until it completes or fails
 */
async function pollFlowRunCompletion(
	client: any,
	flowRunId: string,
	maxAttempts: number = 30, // 30 seconds max
	pollInterval: number = 1000 // 1 second intervals
): Promise<FlowRunStatus> {
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			console.log(
				`Checking flow run status (attempt ${attempt + 1}/${maxAttempts})`
			);

			// Get flow run output
			const flowRun = await client.flowRun(flowRunId).getOutput();

			console.log(`Flow run status:`, flowRun);

			// Check if flow is completed
			if (flowRun.status === "completed") {
				return {
					id: flowRunId,
					status: "completed",
					output: flowRun.output,
				};
			}

			// Check if flow failed
			if (flowRun.status === "failed") {
				return {
					id: flowRunId,
					status: "failed",
					error: flowRun.error || "Flow execution failed",
				};
			}

			// If still running, wait and try again
			if (flowRun.status === "running") {
				console.log(`Flow still running, waiting ${pollInterval}ms...`);
				await new Promise((resolve) => setTimeout(resolve, pollInterval));
				continue;
			}

			// Unknown status
			return {
				id: flowRunId,
				status: "failed",
				error: `Unknown flow status: ${flowRun.status}`,
			};
		} catch (error) {
			console.error(
				`Error checking flow run status (attempt ${attempt + 1}):`,
				error
			);

			// If we've tried enough times, give up
			if (attempt === maxAttempts - 1) {
				return {
					id: flowRunId,
					status: "failed",
					error: "Timeout waiting for flow completion",
				};
			}

			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, pollInterval));
		}
	}

	return {
		id: flowRunId,
		status: "failed",
		error: "Timeout waiting for flow completion",
	};
}
