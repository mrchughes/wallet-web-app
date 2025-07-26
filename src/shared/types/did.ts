export interface DIDIonIdentity {
    did: string;
    publicKey: string;
    privateKey: string; // Encrypted
    keyType: 'RSA' | 'Ed25519';
    created: string;
    lastUsed?: string;
    label?: string;
}

export interface CreateDIDRequest {
    passphrase: string;
    keyType?: 'RSA' | 'Ed25519';
    label?: string;
}

export interface CreateDIDResponse {
    success: boolean;
    did?: string;
    publicKey?: string;
    error?: string;
}

export interface SignRequest {
    data: string;
    passphrase: string;
    did?: string; // If not provided, use default DID
}

export interface SignResponse {
    success: boolean;
    signature?: string;
    did?: string;
    error?: string;
}

export interface DIDDocument {
    '@context': string[];
    id: string;
    verificationMethod: VerificationMethod[];
    authentication: string[];
    assertionMethod: string[];
    service?: ServiceEndpoint[];
}

export interface VerificationMethod {
    id: string;
    type: string;
    controller: string;
    publicKeyJwk?: any;
    publicKeyBase58?: string;
}

export interface ServiceEndpoint {
    id: string;
    type: string;
    serviceEndpoint: string;
}

export interface KeyPair {
    publicKey: string;
    privateKey: string;
    keyType: 'RSA' | 'Ed25519';
}
