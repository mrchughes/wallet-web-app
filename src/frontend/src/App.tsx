import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from 'styled-components';
import { theme } from '@govuk-react/lib';

// Components
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DIDManagementPage from './pages/DIDManagementPage';
import CredentialsPage from './pages/CredentialsPage';
import PermissionsPage from './pages/PermissionsPage';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Styles
import './App.css';
import 'govuk-frontend/govuk/all.scss';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <AuthProvider>
                    <Router>
                        <Layout>
                            <Routes>
                                <Route path="/login" element={<LoginPage />} />
                                <Route
                                    path="/dashboard"
                                    element={
                                        <ProtectedRoute>
                                            <DashboardPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/did"
                                    element={
                                        <ProtectedRoute>
                                            <DIDManagementPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/credentials"
                                    element={
                                        <ProtectedRoute>
                                            <CredentialsPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/permissions"
                                    element={
                                        <ProtectedRoute>
                                            <PermissionsPage />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            </Routes>
                        </Layout>
                    </Router>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
};

export default App;
