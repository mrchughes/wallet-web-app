# Wallet Web App

A web application for managing decentralized identities and verifiable credentials in the Solid ecosystem.

## Overview

The Wallet Web App is a key component of the Solid VC Microservices Prototype. It allows users to:

- Create and manage DID:ION identities
- Securely store private keys in a Solid PDS
- Manage permissions for credential access
- Handle signing requests using DID:ION
- View and manage verifiable credentials

## Repository Structure

- `/docs` - Documentation, OpenAPI specs, and schemas
- `/scripts` - Helper scripts for installation, testing, and running
- `/src` - Application source code
- `/test/mocks` - Mock dependencies for testing

## Key Features

- Integration with Solid OIDC for authentication
- DID:ION identity creation and management
- PDS interactions for credential storage and retrieval
- Permission management for credential access
- Secure storage of private keys with passphrase protection
- UI for credential management and visualization

## Getting Started

See the [SPECIFICATION.md](./SPECIFICATION.md) file for detailed requirements and API definitions.

## Development

This project must be developed according to the requirements specified in SPECIFICATION.md.

### Requirements

- All code must be complete and functional (no TODOs or placeholders)
- Follow GOV.UK Design System for UI components
- Support containerized deployment
- Include comprehensive testing

## License

This project is part of the Solid VC Microservices Prototype.
