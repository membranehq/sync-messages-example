import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UserPlatform } from "@/models/user-platform";
import { getAuthFromRequest } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
	try {
		const auth = getAuthFromRequest(request);
		if (!auth.customerId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await connectDB();

		// Get all user platform records for this customer
		const userPlatforms = await UserPlatform.find({
			customerId: auth.customerId,
		})
			.sort({ lastSynced: -1 })
			.lean();

		const userPlatformsData = userPlatforms.map((platform) => ({
			id: platform._id,
			platformId: platform.platformId,
			platformName: platform.platformName,
			externalUserId: platform.externalUserId,
			externalUserName: platform.externalUserName,
			externalUserEmail: platform.externalUserEmail,
			connectionId: platform.connectionId,
			lastSynced: platform.lastSynced,
			createdAt: platform.createdAt,
			updatedAt: platform.updatedAt,
		}));

		return NextResponse.json({
			userPlatforms: userPlatformsData,
			total: userPlatformsData.length,
		});
	} catch (error) {
		console.error("Error fetching user platform info:", error);
		return NextResponse.json(
			{ error: "Failed to fetch user platform info" },
			{ status: 500 }
		);
	}
}
