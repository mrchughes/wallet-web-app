export interface SolidOidcToken {
    webid: string;
    iss: string;
    sub: string;
    aud: string;
    scope: string;
    exp: number;
    iat: number;
    service_id?: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    token?: string;
    webid?: string;
    expiresIn?: number;
    error?: string;
}

export interface AuthSession {
    token: string;
    webid: string;
    expiresAt: number;
    refreshToken?: string;
}

export interface OidcConfiguration {
    issuer: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope: string[];
}
