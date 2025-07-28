import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { SyncStatus } from "@/models/sync-status";
import { getAuthFromRequest } from "@/lib/server-auth";

// GET: Get current sync status for the user
export async function GET(request: NextRequest) {
	try {
		const auth = getAuthFromRequest(request);
		if (!auth.customerId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await connectDB();

		// Get the most recent sync status for this customer
		const syncStatus = await SyncStatus.findOne({
			customerId: auth.customerId,
		}).sort({ createdAt: -1 });

		if (!syncStatus) {
			return NextResponse.json({
				isSyncing: false,
				lastSyncTime: null,
				status: "idle",
			});
		}

		// Check if the sync is stale (running for more than 30 seconds)
		const now = new Date();
		const syncDuration = now.getTime() - syncStatus.startTime.getTime();
		const isStale = syncStatus.isSyncing && syncDuration > 30 * 1000;

		if (isStale) {
			console.log(
				`🔄 Detected stale sync status for customer ${auth.customerId}, resetting...`
			);

			// Update the sync status to completed (stale)
			await SyncStatus.findByIdAndUpdate(syncStatus._id, {
				isSyncing: false,
				status: "completed",
				error: "Sync timed out",
			});

			return NextResponse.json({
				isSyncing: false,
				lastSyncTime: syncStatus.lastSyncTime,
				status: "completed",
			});
		}

		return NextResponse.json({
			isSyncing: syncStatus.isSyncing,
			lastSyncTime: syncStatus.lastSyncTime,
			status: syncStatus.status,
			syncId: syncStatus.syncId,
			startTime: syncStatus.startTime,
			error: syncStatus.error,
			totalMessages: syncStatus.totalMessages,
			totalChats: syncStatus.totalChats,
		});
	} catch (error) {
		console.error("Error fetching sync status:", error);
		return NextResponse.json(
			{ error: "Failed to fetch sync status" },
			{ status: 500 }
		);
	}
}

// POST: Start a new sync operation
export async function POST(request: NextRequest) {
	try {
		const auth = getAuthFromRequest(request);
		if (!auth.customerId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await connectDB();

		// Check if there's already an active sync
		const existingSync = await SyncStatus.findOne({
			customerId: auth.customerId,
			status: { $in: ["pending", "running"] },
		});

		if (existingSync) {
			return NextResponse.json(
				{ error: "Sync already in progress" },
				{ status: 409 }
			);
		}

		// Create new sync status
		const syncId = `sync-${Date.now()}-${Math.random()
			.toString(36)
			.substr(2, 9)}`;
		const syncStatus = await SyncStatus.create({
			customerId: auth.customerId,
			isSyncing: true,
			startTime: new Date(),
			syncId,
			status: "pending",
		});

		return NextResponse.json({
			syncId: syncStatus.syncId,
			isSyncing: true,
			startTime: syncStatus.startTime,
		});
	} catch (error) {
		console.error("Error starting sync:", error);
		return NextResponse.json(
			{ error: "Failed to start sync" },
			{ status: 500 }
		);
	}
}

// PUT: Update sync status
export async function PUT(request: NextRequest) {
	try {
		const auth = getAuthFromRequest(request);
		if (!auth.customerId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { syncId, status, error, totalMessages, totalChats } = body;

		if (!syncId) {
			return NextResponse.json(
				{ error: "syncId is required" },
				{ status: 400 }
			);
		}

		await connectDB();

		// Update the sync status
		const updateData: Record<string, unknown> = {
			status,
			updatedAt: new Date(),
		};

		if (status === "running") {
			updateData.isSyncing = true;
		} else if (status === "completed" || status === "failed") {
			updateData.isSyncing = false;
			updateData.lastSyncTime = new Date();
		}

		if (error) updateData.error = error;
		if (totalMessages !== undefined) updateData.totalMessages = totalMessages;
		if (totalChats !== undefined) updateData.totalChats = totalChats;

		const syncStatus = await SyncStatus.findOneAndUpdate(
			{ customerId: auth.customerId, syncId },
			updateData,
			{ new: true }
		);

		if (!syncStatus) {
			return NextResponse.json({ error: "Sync not found" }, { status: 404 });
		}

		return NextResponse.json({
			syncId: syncStatus.syncId,
			isSyncing: syncStatus.isSyncing,
			status: syncStatus.status,
			lastSyncTime: syncStatus.lastSyncTime,
		});
	} catch (error) {
		console.error("Error updating sync status:", error);
		return NextResponse.json(
			{ error: "Failed to update sync status" },
			{ status: 500 }
		);
	}
}
