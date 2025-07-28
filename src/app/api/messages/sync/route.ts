import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Message } from "@/models/message";
import { Chat } from "@/models/chat";
import { SyncStatus } from "@/models/sync-status";
import { UserPlatform } from "@/models/user-platform";
import { getAuthFromRequest } from "@/lib/server-auth";
import { getIntegrationClient } from "@/lib/integration-app-client";
import { formatTimestamp } from "@/lib/utils";

export async function POST(request: NextRequest) {
	const auth = getAuthFromRequest(request);
	let syncId: string = "";

	try {
		if (!auth.customerId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await connectDB();

		// Get sync ID from request body
		const body = await request.json();
		syncId = body.syncId;

		if (!syncId) {
			return NextResponse.json(
				{ error: "syncId is required" },
				{ status: 400 }
			);
		}

		// Update sync status to running
		await SyncStatus.findOneAndUpdate(
			{ customerId: auth.customerId, syncId },
			{ status: "running", isSyncing: true }
		);

		// 1. Get Integration.app client
		const client = await getIntegrationClient(auth);

		// 2. Find all available connections
		const connectionsResponse = await client.connections.find();
		const connections = connectionsResponse.items || [];

		if (connections.length === 0) {
			return NextResponse.json(
				{ error: "No apps connected to sync messages from" },
				{ status: 400 }
			);
		}

		let totalMessages = 0;
		let totalChats = 0;

		// 3. Process each connection
		for (const connection of connections) {
			try {
				console.log(
					`Processing connection: ${connection.id} (${
						connection.name || "Unknown"
					})`
				);

				// Get chats first
				const chatsResult = await client
					.connection(connection.id)
					.action("get-chats")
					.run();

				if (chatsResult.output?.records) {
					const chats = chatsResult.output.records as Record<string, unknown>[];

					// Save chats to MongoDB
					for (const chat of chats) {
						try {
							const chatId =
								(chat.id as string) ||
								((chat.fields as Record<string, unknown>)?.id as string);
							const chatFields = chat.fields as Record<string, unknown>;
							const chatRawFields = chat.rawFields as Record<string, unknown>;

							const chatName =
								(chatFields?.name as string) ||
								(chatRawFields?.name as string) ||
								(chat.name as string) ||
								(chat.title as string) ||
								(chat.subject as string) ||
								"Unnamed Chat";

							// Extract participants
							const participants =
								(chat.participants as string[]) ||
								(chat.members as string[]) ||
								(chatFields?.participants as string[]) ||
								(chatFields?.members as string[]) ||
								[];

							// Upsert chat
							await Chat.findOneAndUpdate(
								{
									customerId: auth.customerId,
									id: chatId,
									integrationId: connection.id,
								},
								{
									id: chatId,
									name: chatName,
									participants: participants,
									lastMessage:
										(chat.last_message as string) ||
										(chat.recent_message as string) ||
										(chatFields?.last_message as string),
									lastMessageTime: (() => {
										const rawChatTimestamp =
											(chat.last_message_time as string) ||
											(chat.updated_at as string) ||
											(chatFields?.updated as string) ||
											(chatRawFields?.ts as string);

										const formattedChatTimestamp =
											formatTimestamp(rawChatTimestamp) || undefined;

										console.log(
											`Chat timestamp: raw="${rawChatTimestamp}", formatted="${formattedChatTimestamp}"`
										);

										return formattedChatTimestamp;
									})(),
									integrationId: connection.id,
									platformName: connection.name || connection.id,
									customerId: auth.customerId,
								},
								{ upsert: true, new: true }
							);

							totalChats++;
							console.log(
								`Processed chat: ${chatName} with ${participants.length} participants`
							);
						} catch (chatError) {
							console.error(
								`Error processing chat ${chat.id} from connection ${connection.id}:`,
								chatError
							);
						}
					}

					// Get messages for each chat
					for (const chat of chats) {
						try {
							const chatId =
								(chat.id as string) ||
								((chat.fields as Record<string, unknown>)?.id as string);
							const channelId = chatId;

							const messagesResult = await client
								.connection(connection.id)
								.action("get-messages")
								.run({
									cursor: "",
									channelId: channelId,
								});

							if (messagesResult.output?.records) {
								const messages = messagesResult.output.records as Record<
									string,
									unknown
								>[];

								// Save messages to MongoDB
								for (const msg of messages) {
									try {
										const messageId =
											(msg.id as string) ||
											`${connection.id}-${Date.now()}-${Math.random()}`;

										// Extract message data from the actual structure
										const rawFields = msg.rawFields as Record<string, unknown>;
										const fields = msg.fields as Record<string, unknown>;

										// Extract message content from various possible fields
										const content =
											(fields?.text as string) ||
											(rawFields?.text as string) ||
											(msg.content as string) ||
											(msg.message as string) ||
											(msg.text as string) ||
											"";

										// Extract sender information
										const sender =
											(fields?.ownerId as string) ||
											(rawFields?.user as string) ||
											(msg.sender as string) ||
											(msg.from as string) ||
											(msg.author as string) ||
											"Unknown";

										// Check if this message was sent by the current user
										// by comparing the sender with our stored external user IDs
										const userPlatform = await UserPlatform.findOne({
											customerId: auth.customerId,
											platformId: connection.id,
											externalUserId: sender,
										});

										const isFromCurrentUser = !!userPlatform;

										if (isFromCurrentUser) {
											console.log(
												`✅ Message from current user (${sender}) in ${connection.name}`
											);
										}

										// Extract and format timestamp
										const rawTimestamp =
											(rawFields?.ts as string) ||
											(fields?.timestamp as string) ||
											(msg.timestamp as string) ||
											(msg.created_at as string);

										const timestamp =
											formatTimestamp(rawTimestamp) || new Date().toISOString();

										console.log(
											`Message timestamp: raw="${rawTimestamp}", formatted="${timestamp}"`
										);

										// Check if we already have this message by externalMessageId
										const existingMessage = await Message.findOne({
											customerId: auth.customerId,
											externalMessageId: messageId,
											integrationId: connection.id,
										});

										if (existingMessage) {
											console.log(
												`Message with externalMessageId ${messageId} already exists, skipping import`
											);
											continue;
										}

										// Upsert message
										await Message.findOneAndUpdate(
											{
												customerId: auth.customerId,
												id: messageId,
												integrationId: connection.id,
											},
											{
												id: messageId,
												content: content,
												sender: sender,
												timestamp: timestamp,
												chatId: chatId,
												integrationId: connection.id,
												platformName: connection.name || connection.id,
												messageType: isFromCurrentUser ? "user" : "third-party", // Mark as user message if sent by current user
												externalMessageId: messageId, // Set the external message ID
												customerId: auth.customerId,
												status: "sent", // Imported messages are already sent on the external platform
											},
											{ upsert: true, new: true }
										);

										totalMessages++;
										console.log(
											`Processed message: ${content.substring(
												0,
												50
											)}... from ${sender}`
										);
									} catch (messageError) {
										console.error(
											`Error processing message ${msg.id} from connection ${connection.id}:`,
											messageError
										);
									}
								}
							}
						} catch (chatError) {
							console.error(
								`Error fetching messages for chat ${chat.id} from connection ${connection.id}:`,
								chatError
							);
						}
					}
				}
			} catch (error) {
				console.error(`Error processing connection ${connection.id}:`, error);
			}
		}

		console.log(
			`Sync completed: ${totalMessages} messages, ${totalChats} chats`
		);

		// Update sync status to completed
		await SyncStatus.findOneAndUpdate(
			{ customerId: auth.customerId, syncId },
			{
				status: "completed",
				isSyncing: false,
				lastSyncTime: new Date(),
				totalMessages,
				totalChats,
			}
		);

		return NextResponse.json(
			{
				success: true,
				totalMessages,
				totalChats,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error syncing messages:", error);

		// Update sync status to failed
		if (syncId) {
			await SyncStatus.findOneAndUpdate(
				{ customerId: auth.customerId, syncId },
				{
					status: "failed",
					isSyncing: false,
					error: error instanceof Error ? error.message : "Unknown error",
				}
			);
		}

		return NextResponse.json(
			{ error: "Failed to sync messages" },
			{ status: 500 }
		);
	}
}
