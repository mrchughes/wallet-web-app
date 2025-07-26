import React from 'react';

const PermissionsPage: React.FC = () => {
    return (
        <div className="permissions-page">
            <div className="govuk-grid-row">
                <div className="govuk-grid-column-two-thirds">
                    <h1 className="govuk-heading-xl">Access Permissions</h1>

                    <p className="govuk-body-l">
                        Control who can access your credentials and what they can do with them.
                    </p>

                    <h2 className="govuk-heading-l">Current Permissions</h2>

                    <div className="govuk-inset-text">
                        <p>No permissions have been granted yet.</p>
                        <p>When you share credentials with services, their access permissions will be listed here.</p>
                    </div>

                    <details className="govuk-details" data-module="govuk-details">
                        <summary className="govuk-details__summary">
                            <span className="govuk-details__summary-text">
                                How do permissions work?
                            </span>
                        </summary>
                        <div className="govuk-details__text">
                            <p>
                                Permissions control access to your credentials using Web Access Control (WAC).
                                You can grant or revoke access to specific credentials for specific services or individuals.
                            </p>
                            <p>
                                Permission types include:
                            </p>
                            <ul className="govuk-list govuk-list--bullet">
                                <li><strong>Read:</strong> View the credential</li>
                                <li><strong>Write:</strong> Modify the credential</li>
                                <li><strong>Append:</strong> Add data to the credential</li>
                                <li><strong>Control:</strong> Manage permissions for the credential</li>
                            </ul>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
};

export default PermissionsPage;
