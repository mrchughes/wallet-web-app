import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await login(username, password);
            if (!success) {
                setError('Invalid username or password');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="govuk-grid-row">
                    <div className="govuk-grid-column-two-thirds">
                        <h1 className="govuk-heading-xl">Sign in to Wallet Web App</h1>

                        <p className="govuk-body">
                            Use your credentials to access your decentralized identity wallet.
                        </p>

                        {error && (
                            <div className="govuk-error-summary" aria-labelledby="error-summary-title" role="alert">
                                <h2 className="govuk-error-summary__title" id="error-summary-title">
                                    There is a problem
                                </h2>
                                <div className="govuk-error-summary__body">
                                    <ul className="govuk-list govuk-error-summary__list">
                                        <li>{error}</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="govuk-form">
                            <div className="govuk-form-group">
                                <label className="govuk-label" htmlFor="username">
                                    Username
                                </label>
                                <input
                                    className="govuk-input"
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="govuk-form-group">
                                <label className="govuk-label" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    className="govuk-input"
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                className="govuk-button"
                                disabled={loading}
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>

                        <div className="govuk-inset-text">
                            <p>
                                <strong>Development credentials:</strong><br />
                                Username: <code>testuser</code><br />
                                Password: <code>password</code>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
