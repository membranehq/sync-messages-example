import { v4 as uuidv4 } from 'uuid';

const AUTH_ID_KEY = 'integration_user_id';
const USER_NAME_KEY = 'integration_user_name';

export type AuthUser = {
  userId: string;
  userName: string | null;
};

export function getStoredAuth(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  
  const userId = localStorage.getItem(AUTH_ID_KEY);
  const userName = localStorage.getItem(USER_NAME_KEY);
  
  if (!userId) return null;
  
  return {
    userId,
    userName
  };
}

export function storeAuth(auth: AuthUser): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(AUTH_ID_KEY, auth.userId);
  if (auth.userName) {
    localStorage.setItem(USER_NAME_KEY, auth.userName);
  } else {
    localStorage.removeItem(USER_NAME_KEY);
  }
}

export function generateAndStoreAuth(): AuthUser {
  const auth = {
    userId: uuidv4(),
    userName: null
  };
  storeAuth(auth);
  return auth;
}

export function ensureAuth(): AuthUser {
  const existingAuth = getStoredAuth();
  if (existingAuth) return existingAuth;
  return generateAndStoreAuth();
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_ID_KEY);
  localStorage.removeItem(USER_NAME_KEY);
} 