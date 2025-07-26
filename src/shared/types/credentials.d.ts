export interface VerifiableCredential {
    '@context': string[];
    id: string;
    type: string[];
    issuer: string;
    issuanceDate: string;
    expirationDate?: string;
    credentialSubject: CredentialSubject;
    proof: Proof;
}
export interface CredentialSubject {
    id: string;
    [key: string]: any;
}
export interface Proof {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
}
export interface CredentialMetadata {
    id: string;
    title: string;
    description?: string;
    issuer: string;
    issuerName?: string;
    type: string[];
    issuanceDate: string;
    expirationDate?: string;
    status: 'valid' | 'expired' | 'revoked' | 'unknown';
    format: 'json-ld' | 'turtle';
    location: string;
    permissions: CredentialPermissions;
}
export interface CredentialPermissions {
    read: string[];
    write: string[];
    append: string[];
    control: string[];
}
export interface SetPermissionsRequest {
    credentialId: string;
    accessors: string[];
    actions: ('read' | 'write' | 'append' | 'control')[];
    expirationDate?: string;
}
export interface PermissionRule {
    accessor: string;
    actions: string[];
    resource: string;
    expirationDate?: string;
    granted: string;
    grantedBy: string;
}
export interface CredentialIndex {
    '@context': string[];
    '@id': string;
    '@type': string[];
    'ldp:contains': CredentialReference[];
    'dc:modified': string;
}
export interface CredentialReference {
    '@id': string;
    '@type': string[];
    'dc:title': string;
    'dc:created': string;
    'dc:modified': string;
    'dc:creator': string;
}
//# sourceMappingURL=credentials.d.ts.map