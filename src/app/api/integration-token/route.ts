import { NextRequest, NextResponse } from 'next/server'
import jwt, { Algorithm } from 'jsonwebtoken'
import { getAuthFromRequest } from '@/lib/server-auth'

// Your workspace credentials from Integration.app settings page
const WORKSPACE_KEY = process.env.INTEGRATION_APP_WORKSPACE_KEY
const WORKSPACE_SECRET = process.env.INTEGRATION_APP_WORKSPACE_SECRET

export async function GET(request: NextRequest) {
    if (!WORKSPACE_KEY || !WORKSPACE_SECRET) {
        console.error('Missing Integration.app credentials')
        return NextResponse.json(
            { error: 'Integration.app not configured' },
            { status: 500 }
        )
    }

    try {
        const auth = getAuthFromRequest(request)
        const tokenData = {
            // Required: Identifier of your customer
            id: auth.userId,
            // Required: Human-readable customer name
            name: auth.userName || auth.userId,
            // Optional: Any additional user fields
            fields: {
                hasName: Boolean(auth.userName),
                timestamp: new Date().toISOString()
            }
        }

        const options = {
            issuer: WORKSPACE_KEY,
            expiresIn: 7200, // 2 hours
            algorithm: 'HS512' as Algorithm
        }

        const token = jwt.sign(tokenData, WORKSPACE_SECRET, options)
        return NextResponse.json({ token })
    } catch (error) {
        console.error('Error generating token:', error)
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        )
    }
} 