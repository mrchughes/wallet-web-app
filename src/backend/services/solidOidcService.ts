import axios from 'axios';
import jwt from 'jsonwebtoken';
import { SolidOidcToken, LoginRequest, LoginResponse, OidcConfiguration } from '../../shared/types/auth';

export class SolidOidcService {
    private config: OidcConfiguration;

    constructor() {
        this.config = {
            issuer: process.env.SOLID_OIDC_ISSUER || 'https://oidc.solid.gov.uk',
            clientId: process.env.SOLID_OIDC_CLIENT_ID || 'wallet-web-app',
            clientSecret: process.env.SOLID_OIDC_CLIENT_SECRET || '',
            redirectUri: process.env.SOLID_OIDC_REDIRECT_URI || 'http://localhost:3001/auth/callback',
            scope: ['openid', 'profile', 'webid']
        };
    }

    async authenticate(loginRequest: LoginRequest): Promise<LoginResponse> {
        try {
            // In development/mock mode, simulate OIDC authentication
            if (process.env.MOCK_SERVICES === 'true') {
                return this.mockAuthenticate(loginRequest);
            }

            // Real OIDC authentication flow
            const tokenResponse = await this.exchangeCredentialsForToken(loginRequest);

            if (!tokenResponse.access_token) {
                return {
                    success: false,
                    error: 'Failed to obtain access token'
                };
            }

            // Verify and extract WebID from token
            const tokenData = await this.verifyToken(tokenResponse.access_token);

            if (!tokenData.webid) {
                return {
                    success: false,
                    error: 'Token does not contain WebID'
                };
            }

            // Create internal JWT for session management
            const sessionToken = this.createSessionToken(tokenData);

            return {
                success: true,
                token: sessionToken,
                webid: tokenData.webid,
                expiresIn: tokenData.exp ? tokenData.exp - Math.floor(Date.now() / 1000) : 3600
            };

        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                error: 'Authentication failed'
            };
        }
    }

    async verifyToken(token: string): Promise<SolidOidcToken> {
        try {
            // In mock mode, decode without verification
            if (process.env.MOCK_SERVICES === 'true') {
                const decoded = jwt.decode(token) as SolidOidcToken;
                if (!decoded) {
                    throw new Error('Invalid token format');
                }
                return decoded;
            }

            // Get OIDC configuration and verify token
            const jwksUri = `${this.config.issuer}/.well-known/jwks.json`;
            const jwksResponse = await axios.get(jwksUri);

            // This is a simplified verification - in production, use a proper JWKS library
            const decoded = jwt.decode(token, { complete: true }) as any;

            if (!decoded || !decoded.payload) {
                throw new Error('Invalid token');
            }

            return decoded.payload as SolidOidcToken;
        } catch (error) {
            throw new Error('Token verification failed');
        }
    }

    private async exchangeCredentialsForToken(loginRequest: LoginRequest): Promise<any> {
        const tokenEndpoint = `${this.config.issuer}/token`;

        const response = await axios.post(tokenEndpoint, {
            grant_type: 'password',
            username: loginRequest.username,
            password: loginRequest.password,
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            scope: this.config.scope.join(' ')
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;
    }

    private createSessionToken(oidcToken: SolidOidcToken): string {
        const sessionData = {
            webid: oidcToken.webid,
            iss: oidcToken.iss,
            sub: oidcToken.sub,
            aud: this.config.clientId,
            scope: oidcToken.scope || 'openid profile webid',
            exp: oidcToken.exp || Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000)
        };

        return jwt.sign(sessionData, process.env.JWT_SECRET as string);
    }

    private mockAuthenticate(loginRequest: LoginRequest): LoginResponse {
        // Mock authentication for development
        const mockWebId = `https://user.example.org/profile/card#me`;

        const mockToken: SolidOidcToken = {
            webid: mockWebId,
            iss: this.config.issuer,
            sub: `user-${loginRequest.username}`,
            aud: this.config.clientId,
            scope: 'openid profile webid',
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000)
        };

        const sessionToken = jwt.sign(mockToken, process.env.JWT_SECRET as string);

        return {
            success: true,
            token: sessionToken,
            webid: mockWebId,
            expiresIn: 3600
        };
    }

    async discoverPodFromWebId(webid: string): Promise<string | null> {
        try {
            // Extract domain from WebID
            const url = new URL(webid);
            const domain = url.origin;

            // Try to fetch WebID document
            const response = await axios.get(webid, {
                headers: {
                    'Accept': 'text/turtle, application/ld+json'
                }
            });

            // Parse RDF to find storage triple
            // For now, use a simple fallback
            return `${domain}/storage/`;
        } catch (error) {
            console.error('Pod discovery failed:', error);
            // Fallback to standard storage location
            const url = new URL(webid);
            return `${url.origin}/storage/`;
        }
    }
}
