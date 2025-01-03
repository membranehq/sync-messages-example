import { NextResponse, type NextRequest } from 'next/server'
import { getAuthFromRequest } from '@/lib/server-auth'

export function middleware(request: NextRequest) {
    // Only apply to /api routes
    if (!request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next()
    }

    const auth = getAuthFromRequest(request)
    if (!auth.userId) {
        return NextResponse.json(
            { error: 'Unauthorized: Missing user ID' },
            { 
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Bearer realm="Integration App"'
                }
            }
        )
    }

    // Continue with the authenticated request
    return NextResponse.next()
}

export const config = {
    matcher: '/api/:path*'
} 