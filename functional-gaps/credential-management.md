# Credential Management Gaps - Implementation Plan

## Current Gaps
- VC storage in PDS is incomplete
- Missing support for selective disclosure
- No credential revocation checking
- Incomplete support for different credential formats

## Implementation Plan

### 1. Complete VC Storage in PDS (Priority: High)

#### Current Implementation Status
Basic credential storage exists but lacks proper organization, indexing, and secure access control.

#### Solution
1. Enhance the `pdsService.ts` to support:
   - Hierarchical storage of VCs by type and issuer
   - Metadata indexing for efficient retrieval
   - Versioning support for credential updates
   - Encrypted storage for sensitive credentials

#### Implementation Details
```typescript
// Extend the PDS service with enhanced VC storage
public async storeCredential(
  credential: VerifiableCredential,
  options: {
    encrypted: boolean,
    indexFields?: string[],
    tags?: string[],
    versioning?: boolean
  }
): Promise<string> {
  // Implementation logic
}

// Add structured query capabilities
public async queryCredentials(
  query: {
    type?: string | string[],
    issuer?: string,
    subject?: string,
    tags?: string[],
    dateRange?: {
      issuanceDate?: { from?: string, to?: string },
      expirationDate?: { from?: string, to?: string }
    },
    customFilters?: Record<string, any>
  }
): Promise<VerifiableCredential[]> {
  // Implementation logic
}
```

### 2. Implement Selective Disclosure (Priority: High)

#### Current Implementation Status
No support for selective disclosure of credential attributes.

#### Solution
1. Implement support for BBS+ signatures for selective disclosure
2. Create a new service for handling selective disclosure operations
3. Develop UI components for selecting which attributes to disclose

#### Implementation Details
```typescript
// New selective disclosure service
export class SelectiveDisclosureService {
  // Generate a selective disclosure credential
  public async createSelectiveDisclosure(
    credential: VerifiableCredential,
    disclosedAttributes: string[]
  ): Promise<VerifiableCredential> {
    // Implementation logic
  }
  
  // Verify a selective disclosure credential
  public async verifySelectiveDisclosure(
    credential: VerifiableCredential
  ): Promise<boolean> {
    // Implementation logic
  }
}

// UI component for attribute selection
// In a new file src/frontend/src/components/CredentialDisclosure/DisclosureSelector.tsx
import React, { useState } from 'react';

interface DisclosureSelectorProps {
  credential: any;
  onSelectionComplete: (selectedAttributes: string[]) => void;
}

export const DisclosureSelector: React.FC<DisclosureSelectorProps> = ({
  credential,
  onSelectionComplete
}) => {
  // Component implementation
};
```

### 3. Implement Credential Revocation Checking (Priority: Medium)

#### Current Implementation Status
No mechanism to check if a credential has been revoked.

#### Solution
1. Implement support for multiple revocation methods:
   - Status List 2021
   - Revocation List 2020
   - OCSP-style status checking
2. Create a service for handling revocation checks
3. Implement automatic periodic checking for important credentials

#### Implementation Details
```typescript
// Revocation service
export class RevocationService {
  // Check if a credential is revoked
  public async checkRevocationStatus(
    credential: VerifiableCredential,
    options?: {
      forceRefresh?: boolean,
      timeout?: number
    }
  ): Promise<{
    isRevoked: boolean,
    lastChecked: Date,
    method: string,
    details?: any
  }> {
    // Implementation logic
  }
  
  // Register for revocation notifications
  public registerForRevocationUpdates(
    credentialIds: string[],
    notificationMethod: 'poll' | 'webhook',
    notificationTarget?: string
  ): Promise<void> {
    // Implementation logic
  }
}
```

### 4. Support for Different Credential Formats (Priority: Medium)

#### Current Implementation Status
Limited support for credential formats, primarily JSON-LD.

#### Solution
1. Extend the credential service to support:
   - JSON-LD (complete implementation)
   - JWT/JWS VCs
   - SD-JWT
   - ISO mDL
   - W3C Data Integrity formats
2. Create adapters for each credential format
3. Implement converters between formats where possible

#### Implementation Details
```typescript
// Credential format adapters
export interface CredentialAdapter {
  parse(raw: any): VerifiableCredential;
  format(credential: VerifiableCredential): any;
  verify(credential: any): Promise<boolean>;
  isSupported(data: any): boolean;
}

// JWT Adapter implementation
export class JwtCredentialAdapter implements CredentialAdapter {
  // Implementation methods
}

// SD-JWT Adapter implementation
export class SdJwtCredentialAdapter implements CredentialAdapter {
  // Implementation methods
}

// mDL Adapter implementation
export class MdlCredentialAdapter implements CredentialAdapter {
  // Implementation methods
}

// Registry for credential formats
export class CredentialFormatRegistry {
  private adapters: Map<string, CredentialAdapter> = new Map();
  
  public registerAdapter(format: string, adapter: CredentialAdapter): void {
    this.adapters.set(format, adapter);
  }
  
  public getAdapter(format: string): CredentialAdapter | undefined {
    return this.adapters.get(format);
  }
  
  public detectFormat(credential: any): string | undefined {
    // Implementation logic
  }
}
```

## Timeline
- VC Storage Completion: 3 weeks
- Selective Disclosure Implementation: 4 weeks
- Revocation Checking: 2 weeks
- Multi-format Support: 4 weeks

## Dependencies
- PDS storage capabilities
- BBS+ libraries for selective disclosure
- Access to revocation services
- Format-specific libraries for different credential types
