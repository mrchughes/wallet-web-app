import axios from 'axios';
import { SolidOidcService } from './solidOidcService';
import {
    VerifiableCredential,
    CredentialMetadata,
    SetPermissionsRequest,
    PermissionRule,
    CredentialIndex
} from '../../shared/types/credentials';

export interface PdsResponse {
    success: boolean;
    data?: string;
    contentType?: string;
    error?: string;
}

export class PdsService {
    private solidOidcService: SolidOidcService;
    private baseUrl: string;

    constructor(solidOidcService: SolidOidcService) {
        this.solidOidcService = solidOidcService;
        this.baseUrl = process.env.PDS_BASE_URL || 'https://pds.example.org';
    }

    async getCredentials(webid: string): Promise<CredentialMetadata[]> {
        try {
            // Get pod URL from WebID
            const podUrl = await this.solidOidcService.discoverPodFromWebId(webid);
            if (!podUrl) {
                throw new Error('Could not discover pod URL');
            }

            // Get credentials index
            const indexPath = '/credentials/index.ttl';
            const indexResponse = await this.getResource(indexPath, webid);

            if (!indexResponse.success) {
                return [];
            }

            // Parse credentials index (simplified - would need proper RDF parsing)
            return this.parseCredentialsIndex(indexResponse.data || '');

        } catch (error) {
            console.error('Error getting credentials:', error);
            return [];
        }
    }

    async getCredential(credentialId: string, webid: string, format: 'json-ld' | 'turtle' = 'json-ld'): Promise<VerifiableCredential | null> {
        try {
            const credentialPath = `/credentials/${credentialId}`;
            const response = await this.getResource(credentialPath, webid);

            if (!response.success || !response.data) {
                return null;
            }

            if (format === 'json-ld') {
                return JSON.parse(response.data);
            } else {
                // Convert Turtle to JSON-LD (simplified)
                return this.parseTurtleToJsonLd(response.data);
            }

        } catch (error) {
            console.error('Error getting credential:', error);
            return null;
        }
    }

    async storeCredential(credential: VerifiableCredential, webid: string, format: 'json-ld' | 'turtle' = 'json-ld'): Promise<boolean> {
        try {
            const credentialId = this.extractCredentialId(credential.id);
            const credentialPath = `/credentials/${credentialId}`;

            let content: string;
            let contentType: string;

            if (format === 'json-ld') {
                content = JSON.stringify(credential, null, 2);
                contentType = 'application/ld+json';
            } else {
                content = this.convertToTurtle(credential);
                contentType = 'text/turtle';
            }

            const result = await this.storeResource(credentialPath, content, webid, contentType);

            if (result) {
                // Update credentials index
                await this.updateCredentialsIndex(credential, webid);
            }

            return result;

        } catch (error) {
            console.error('Error storing credential:', error);
            return false;
        }
    }

    async setPermissions(request: SetPermissionsRequest, webid: string): Promise<boolean> {
        try {
            const credentialPath = `/credentials/${request.credentialId}`;
            const aclPath = `${credentialPath}.acl`;

            const aclContent = this.generateAclContent(request, webid);

            return await this.storeResource(aclPath, aclContent, webid, 'text/turtle');

        } catch (error) {
            console.error('Error setting permissions:', error);
            return false;
        }
    }

    async getPermissions(credentialId: string, webid: string): Promise<PermissionRule[]> {
        try {
            const credentialPath = `/credentials/${credentialId}`;
            const aclPath = `${credentialPath}.acl`;

            const response = await this.getResource(aclPath, webid);

            if (!response.success || !response.data) {
                return [];
            }

            return this.parseAclContent(response.data);

        } catch (error) {
            console.error('Error getting permissions:', error);
            return [];
        }
    }

    async getResource(path: string, webid: string): Promise<PdsResponse> {
        try {
            if (process.env.MOCK_SERVICES === 'true') {
                return this.mockGetResource(path, webid);
            }

            const podUrl = await this.solidOidcService.discoverPodFromWebId(webid);
            if (!podUrl) {
                return { success: false, error: 'Could not discover pod URL' };
            }

            const fullUrl = `${podUrl.replace(/\/$/, '')}${path}`;

            const response = await axios.get(fullUrl, {
                headers: {
                    'Accept': 'text/turtle, application/ld+json, application/json',
                    'Authorization': `Bearer ${this.getAccessToken(webid)}`
                }
            });

            return {
                success: true,
                data: response.data,
                contentType: response.headers['content-type']
            };

        } catch (error) {
            return {
                success: false,
                error: `Failed to get resource: ${path}`
            };
        }
    }

    async storeResource(path: string, content: string, webid: string, contentType: string): Promise<boolean> {
        try {
            if (process.env.MOCK_SERVICES === 'true') {
                return this.mockStoreResource(path, content, webid, contentType);
            }

            const podUrl = await this.solidOidcService.discoverPodFromWebId(webid);
            if (!podUrl) {
                return false;
            }

            const fullUrl = `${podUrl.replace(/\/$/, '')}${path}`;

            await axios.put(fullUrl, content, {
                headers: {
                    'Content-Type': contentType,
                    'Authorization': `Bearer ${this.getAccessToken(webid)}`
                }
            });

            return true;

        } catch (error) {
            console.error('Error storing resource:', error);
            return false;
        }
    }

    private getAccessToken(webid: string): string {
        // In a real implementation, this would retrieve the access token for the user
        // For now, return a mock token
        return 'mock-access-token';
    }

    private parseCredentialsIndex(indexContent: string): CredentialMetadata[] {
        // Simplified parser - in real implementation, use proper RDF library
        const credentials: CredentialMetadata[] = [];

        // Mock some credentials for development
        if (process.env.MOCK_SERVICES === 'true') {
            credentials.push({
                id: 'pip-benefit-vc-123',
                title: 'PIP Benefit Award',
                issuer: 'https://pip.gov.uk/did.json',
                issuerName: 'Personal Independence Payment Service',
                type: ['VerifiableCredential', 'BenefitAwardCredential'],
                issuanceDate: '2025-07-20T10:00:00Z',
                expirationDate: '2026-07-20T10:00:00Z',
                status: 'valid',
                format: 'json-ld',
                location: '/credentials/pip-benefit-vc-123',
                permissions: {
                    read: ['https://user.example.org/profile/card#me', 'https://eon.co.uk/agent'],
                    write: ['https://user.example.org/profile/card#me'],
                    append: [],
                    control: ['https://user.example.org/profile/card#me']
                }
            });
        }

        return credentials;
    }

    private extractCredentialId(credentialUri: string): string {
        return credentialUri.split('/').pop() || credentialUri.replace(/[^a-zA-Z0-9]/g, '_');
    }

    private convertToTurtle(credential: VerifiableCredential): string {
        // Simplified conversion - in real implementation, use proper RDF library
        return `@prefix cred: <https://www.w3.org/2018/credentials#> .
@prefix schema: <http://schema.org/> .

<${credential.id}>
  a cred:VerifiableCredential ;
  cred:issuer <${credential.issuer}> ;
  cred:credentialSubject <${credential.credentialSubject.id}> ;
  cred:issuanceDate "${credential.issuanceDate}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .`;
    }

    private parseTurtleToJsonLd(turtleContent: string): VerifiableCredential {
        // Simplified parser - in real implementation, use proper RDF library
        return {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id: 'urn:uuid:mock',
            type: ['VerifiableCredential'],
            issuer: 'https://mock.issuer.org',
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                id: 'https://user.example.org/profile/card#me'
            },
            proof: {
                type: 'RsaSignature2018',
                created: new Date().toISOString(),
                proofPurpose: 'assertionMethod',
                verificationMethod: 'https://mock.issuer.org/keys/1',
                jws: 'mock-signature'
            }
        };
    }

    private async updateCredentialsIndex(credential: VerifiableCredential, webid: string): Promise<void> {
        // Update the credentials index with the new credential
        const indexPath = '/credentials/index.ttl';

        const indexContent = `@prefix ldp: <http://www.w3.org/ns/ldp#> .
@prefix dc: <http://purl.org/dc/terms/> .

<index.ttl>
  a ldp:Container ;
  ldp:contains <${this.extractCredentialId(credential.id)}> ;
  dc:modified "${new Date().toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .`;

        await this.storeResource(indexPath, indexContent, webid, 'text/turtle');
    }

    private generateAclContent(request: SetPermissionsRequest, webid: string): string {
        const aclRules = request.accessors.map((accessor, index) => `
<#rule${index}>
  a acl:Authorization ;
  acl:agent <${accessor}> ;
  acl:accessTo <${request.credentialId}> ;
  acl:mode ${request.actions.map(action => `acl:${action.charAt(0).toUpperCase() + action.slice(1)}`).join(', ')} ;
  dc:created "${new Date().toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .`).join('\n');

        return `@prefix acl: <http://www.w3.org/ns/auth/acl#> .
@prefix dc: <http://purl.org/dc/terms/> .

${aclRules}`;
    }

    private parseAclContent(aclContent: string): PermissionRule[] {
        // Simplified parser - in real implementation, use proper RDF library
        return [];
    }

    private mockGetResource(path: string, webid: string): PdsResponse {
        // Mock implementation for development
        if (path === '/credentials/index.ttl') {
            return {
                success: true,
                data: '@prefix ldp: <http://www.w3.org/ns/ldp#> .\n<index.ttl> a ldp:Container .',
                contentType: 'text/turtle'
            };
        }

        return {
            success: false,
            error: 'Resource not found'
        };
    }

    private mockStoreResource(path: string, content: string, webid: string, contentType: string): boolean {
        // Mock implementation - in real app, would store to filesystem or database
        console.log(`Mock storing resource: ${path}`);
        console.log(`Content type: ${contentType}`);
        console.log(`Content length: ${content.length} characters`);
        return true;
    }
}
