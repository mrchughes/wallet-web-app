import React from 'react';

const CredentialsPage: React.FC = () => {
    return (
        <div className="credentials-page">
            <div className="govuk-grid-row">
                <div className="govuk-grid-column-full">
                    <h1 className="govuk-heading-xl">Verifiable Credentials</h1>

                    <p className="govuk-body-l">
                        View and manage your verifiable credentials stored in your Solid pod.
                    </p>

                    <h2 className="govuk-heading-l">Your Credentials</h2>

                    <div className="govuk-inset-text">
                        <p>No credentials found in your pod.</p>
                        <p>Credentials issued to you will appear here automatically.</p>
                    </div>

                    <details className="govuk-details" data-module="govuk-details">
                        <summary className="govuk-details__summary">
                            <span className="govuk-details__summary-text">
                                What are verifiable credentials?
                            </span>
                        </summary>
                        <div className="govuk-details__text">
                            <p>
                                Verifiable credentials are tamper-evident digital documents that can be
                                cryptographically verified. They represent information about you, such as
                                qualifications, licenses, or benefit entitlements.
                            </p>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
};

export default CredentialsPage;
