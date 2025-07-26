import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="dashboard-page">
            <div className="govuk-grid-row">
                <div className="govuk-grid-column-full">
                    <h1 className="govuk-heading-xl">Dashboard</h1>

                    <div className="govuk-inset-text">
                        <p>Welcome to your Wallet Web App dashboard.</p>
                        <p><strong>Your WebID:</strong> {user?.webid}</p>
                    </div>

                    <div className="govuk-grid-row">
                        <div className="govuk-grid-column-one-third">
                            <div className="govuk-panel govuk-panel--confirmation">
                                <h2 className="govuk-panel__title">DID Identities</h2>
                                <div className="govuk-panel__body">
                                    <strong>0</strong> created
                                </div>
                            </div>
                        </div>

                        <div className="govuk-grid-column-one-third">
                            <div className="govuk-panel govuk-panel--confirmation">
                                <h2 className="govuk-panel__title">Credentials</h2>
                                <div className="govuk-panel__body">
                                    <strong>0</strong> stored
                                </div>
                            </div>
                        </div>

                        <div className="govuk-grid-column-one-third">
                            <div className="govuk-panel govuk-panel--confirmation">
                                <h2 className="govuk-panel__title">Permissions</h2>
                                <div className="govuk-panel__body">
                                    <strong>0</strong> granted
                                </div>
                            </div>
                        </div>
                    </div>

                    <h2 className="govuk-heading-l">Quick Actions</h2>

                    <div className="govuk-grid-row">
                        <div className="govuk-grid-column-one-half">
                            <h3 className="govuk-heading-m">Create DID Identity</h3>
                            <p className="govuk-body">
                                Create a new DID:ION identity to sign credentials and authenticate your digital identity.
                            </p>
                            <a href="/did" className="govuk-button">
                                Create DID Identity
                            </a>
                        </div>

                        <div className="govuk-grid-column-one-half">
                            <h3 className="govuk-heading-m">View Credentials</h3>
                            <p className="govuk-body">
                                Manage your verifiable credentials, control access permissions, and view credential details.
                            </p>
                            <a href="/credentials" className="govuk-button govuk-button--secondary">
                                View Credentials
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
