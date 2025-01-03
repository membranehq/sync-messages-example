import { NextRequest } from 'next/server'
import type { AuthUser } from './auth'

export function getAuthFromRequest(request: NextRequest): AuthUser {
    return {
        userId: request.headers.get('x-auth-id') ?? '',
        userName: request.headers.get('x-user-name') ?? null
    }
} 