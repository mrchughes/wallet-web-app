import crypto from 'crypto';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
    DIDIonIdentity,
    CreateDIDRequest,
    CreateDIDResponse,
    SignRequest,
    SignResponse,
    DIDDocument,
    KeyPair
} from '../../shared/types/did';
import { PdsService } from './pdsService';

const generateKeyPair = promisify(crypto.generateKeyPair);

export class DIDIonService {
    private pdsService: PdsService;
    private didIonBaseUrl: string;

    constructor(pdsService: PdsService) {
        this.pdsService = pdsService;
        this.didIonBaseUrl = process.env.DID_ION_SERVICE_URL || 'http://localhost:3002';
    }

    async createDID(request: CreateDIDRequest, webid: string): Promise<CreateDIDResponse> {
        try {
            // Generate key pair
            const keyPair = await this.generateKeyPair(request.keyType || 'RSA');

            // Create DID:ION identity
            const didResponse = await this.registerWithDIDIonService(keyPair.publicKey);

            if (!didResponse.success) {
                return {
                    success: false,
                    error: 'Failed to register DID with ION service'
                };
            }

            if (!didResponse.did) {
                return {
                    success: false,
                    error: 'DID registration succeeded but no DID returned'
                };
            }

            // Encrypt private key with passphrase
            const encryptedPrivateKey = this.encryptPrivateKey(keyPair.privateKey, request.passphrase);

            // Create DID identity object
            const didIdentity: DIDIonIdentity = {
                did: didResponse.did,
                publicKey: keyPair.publicKey,
                privateKey: encryptedPrivateKey,
                keyType: request.keyType || 'RSA',
                created: new Date().toISOString(),
                label: request.label || 'Primary Identity'
            };

            // Store DID identity in PDS
            await this.storeDIDInPDS(didIdentity, webid);

            return {
                success: true,
                did: didResponse.did,
                publicKey: keyPair.publicKey
            };

        } catch (error) {
            console.error('DID creation error:', error);
            return {
                success: false,
                error: 'Failed to create DID identity'
            };
        }
    }

    async signData(request: SignRequest, webid: string): Promise<SignResponse> {
        try {
            // Get DID identity from PDS
            const didIdentity = await this.getDIDFromPDS(request.did, webid);

            if (!didIdentity) {
                return {
                    success: false,
                    error: 'DID identity not found'
                };
            }

            // Decrypt private key
            const privateKey = this.decryptPrivateKey(didIdentity.privateKey, request.passphrase);

            // Sign the data
            const signature = this.createSignature(request.data, privateKey, didIdentity.keyType);

            // Update last used timestamp
            didIdentity.lastUsed = new Date().toISOString();
            await this.storeDIDInPDS(didIdentity, webid);

            return {
                success: true,
                signature,
                did: didIdentity.did
            };

        } catch (error) {
            console.error('Signing error:', error);
            return {
                success: false,
                error: 'Failed to sign data'
            };
        }
    }

    async listDIDs(webid: string): Promise<DIDIonIdentity[]> {
        try {
            const didsPath = '/identity/dids/';
            const indexResponse = await this.pdsService.getResource(`${didsPath}index.ttl`, webid);

            if (!indexResponse.success) {
                return [];
            }

            // Parse index to get DID list
            // For now, return empty array - would need RDF parsing
            return [];
        } catch (error) {
            console.error('Error listing DIDs:', error);
            return [];
        }
    }

    async resolveDID(did: string): Promise<DIDDocument | null> {
        try {
            if (process.env.MOCK_SERVICES === 'true') {
                return this.mockResolveDID(did);
            }

            const response = await axios.get(`${this.didIonBaseUrl}/did/resolve/${encodeURIComponent(did)}`);
            return response.data;
        } catch (error) {
            console.error('DID resolution error:', error);
            return null;
        }
    }

    private async generateKeyPair(keyType: 'RSA' | 'Ed25519'): Promise<KeyPair> {
        if (keyType === 'RSA') {
            const { publicKey, privateKey } = await generateKeyPair('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });

            return {
                publicKey: publicKey as string,
                privateKey: privateKey as string,
                keyType: 'RSA'
            };
        } else {
            const { publicKey, privateKey } = await generateKeyPair('ed25519', {
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });

            return {
                publicKey: publicKey as string,
                privateKey: privateKey as string,
                keyType: 'Ed25519'
            };
        }
    }

    private async registerWithDIDIonService(publicKey: string): Promise<{ success: boolean; did?: string; error?: string }> {
        try {
            if (process.env.MOCK_SERVICES === 'true') {
                return {
                    success: true,
                    did: `did:ion:${uuidv4()}`
                };
            }

            const response = await axios.post(`${this.didIonBaseUrl}/did/create`, {
                publicKey
            });

            return {
                success: true,
                did: response.data.did
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to register with DID:ION service'
            };
        }
    }

    private encryptPrivateKey(privateKey: string, passphrase: string): string {
        const algorithm = 'aes-256-gcm';
        const salt = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);

        const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');

        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(privateKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return JSON.stringify({
            encrypted,
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            algorithm
        });
    }

    private decryptPrivateKey(encryptedData: string, passphrase: string): string {
        const data = JSON.parse(encryptedData);
        const key = crypto.pbkdf2Sync(passphrase, Buffer.from(data.salt, 'hex'), 100000, 32, 'sha256');
        const iv = Buffer.from(data.iv, 'hex');

        const decipher = crypto.createDecipheriv(data.algorithm, key, iv);
        decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

        let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    private createSignature(data: string, privateKey: string, keyType: 'RSA' | 'Ed25519'): string {
        if (keyType === 'RSA') {
            const sign = crypto.createSign('SHA256');
            sign.update(data);
            sign.end();
            return sign.sign(privateKey, 'base64');
        } else {
            // Ed25519 signing
            const sign = crypto.createSign('ed25519');
            sign.update(data);
            sign.end();
            return sign.sign(privateKey, 'base64');
        }
    }

    private async storeDIDInPDS(didIdentity: DIDIonIdentity, webid: string): Promise<void> {
        const didPath = `/identity/dids/${didIdentity.did.replace(':', '_')}.json`;
        await this.pdsService.storeResource(didPath, JSON.stringify(didIdentity), webid, 'application/json');
    }

    private async getDIDFromPDS(did: string | undefined, webid: string): Promise<DIDIonIdentity | null> {
        try {
            // If no specific DID requested, get the primary/first DID
            if (!did) {
                const dids = await this.listDIDs(webid);
                return dids.length > 0 ? dids[0] : null;
            }

            const didPath = `/identity/dids/${did.replace(':', '_')}.json`;
            const response = await this.pdsService.getResource(didPath, webid);

            if (!response.success || !response.data) {
                return null;
            }

            return JSON.parse(response.data);
        } catch (error) {
            console.error('Error getting DID from PDS:', error);
            return null;
        }
    }

    private mockResolveDID(did: string): DIDDocument {
        return {
            '@context': [
                'https://www.w3.org/ns/did/v1',
                'https://w3id.org/security/v1'
            ],
            id: did,
            verificationMethod: [{
                id: `${did}#key1`,
                type: 'RsaVerificationKey2018',
                controller: did,
                publicKeyBase58: 'mockPublicKey123'
            }],
            authentication: [`${did}#key1`],
            assertionMethod: [`${did}#key1`]
        };
    }
}
