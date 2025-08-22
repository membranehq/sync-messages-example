import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { UserPlatform } from "@/models/user-platform";
import { getAuthFromRequest } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
	try {
		const auth = await getAuthFromRequest(request);
		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const platformId = searchParams.get("platformId");

		if (!platformId) {
			return NextResponse.json(
				{ error: "Platform ID is required" },
				{ status: 400 }
			);
		}

		await connectDB();

		const userPlatform = await UserPlatform.findOne({
			platformId: platformId,
			customerId: auth.customerId,
		});

		return NextResponse.json({
			success: true,
			platformId,
			importNew: userPlatform ? userPlatform.importNew : true, // Default to true if no record exists
			exists: !!userPlatform,
		});
	} catch (error) {
		console.error("Error getting import new setting:", error);
		return NextResponse.json(
			{ error: "Failed to get import new setting" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const auth = await getAuthFromRequest(request);
		if (!auth) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { platformId, importNew } = await request.json();

		if (typeof platformId !== "string" || typeof importNew !== "boolean") {
			return NextResponse.json(
				{ error: "Invalid parameters" },
				{ status: 400 }
			);
		}

		await connectDB();

		// Update or create the user platform settings
		await UserPlatform.findOneAndUpdate(
			{
				platformId: platformId,
				customerId: auth.customerId,
			},
			{
				importNew: importNew,
			},
			{
				upsert: true, // Create if doesn't exist
				new: true,
			}
		);

		console.log(
			`✅ Updated importNew setting for platform ${platformId}: ${importNew}`
		);

		return NextResponse.json({
			success: true,
			message: `Import new setting updated to ${importNew}`,
		});
	} catch (error) {
		console.error("Error updating import new setting:", error);
		return NextResponse.json(
			{ error: "Failed to update import new setting" },
			{ status: 500 }
		);
	}
}
