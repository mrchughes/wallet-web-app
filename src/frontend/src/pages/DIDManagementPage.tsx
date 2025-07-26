import React from 'react';

const DIDManagementPage: React.FC = () => {
    return (
        <div className="did-management-page">
            <div className="govuk-grid-row">
                <div className="govuk-grid-column-two-thirds">
                    <h1 className="govuk-heading-xl">DID Identity Management</h1>

                    <p className="govuk-body-l">
                        Create and manage your DID:ION decentralized identities for signing credentials and authentication.
                    </p>

                    <div className="govuk-warning-text">
                        <span className="govuk-warning-text__icon" aria-hidden="true">!</span>
                        <strong className="govuk-warning-text__text">
                            <span className="govuk-warning-text__assistive">Warning</span>
                            This is a prototype implementation. Do not use for production data.
                        </strong>
                    </div>

                    <h2 className="govuk-heading-l">Your DID Identities</h2>

                    <div className="govuk-inset-text">
                        <p>No DID identities created yet.</p>
                        <p>Create your first DID:ION identity to get started.</p>
                    </div>

                    <button className="govuk-button">
                        Create New DID Identity
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DIDManagementPage;
