import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-me-in-production-32chars-min'
);
const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

export type StaffRole = 'pharmacist' | 'admin' | 'owner';
export type UserRole = 'customer' | StaffRole;

export type SessionClaims = {
  sub: string;
  email: string;
  role: UserRole;
};

/** Helper: is the caller a staff member (any non-customer role). */
export function isStaffRole(role: UserRole): role is StaffRole {
  return role !== 'customer';
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.role !== 'string'
    ) {
      return null;
    }
    return payload as unknown as SessionClaims;
  } catch {
    return null;
  }
}
