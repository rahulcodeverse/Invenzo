export interface JwtPayload {
  sub: string; // userId
  email: string;
  tenantId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}

