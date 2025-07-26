import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Header,
    TopNav,
    GlobalHeader,
    Main,
    Footer,
    Button,
    LoadingBox
} from '@govuk-react/lib';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, isAuthenticated, logout, loading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isLoginPage = location.pathname === '/login';

    if (loading) {
        return (
            <div className="loading-spinner">
                <LoadingBox>Loading Wallet Web App...</LoadingBox>
            </div>
        );
    }

    return (
        <>
            <GlobalHeader>
                <Header>
                    <Header.Container>
                        <Header.Logo>
                            <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
                                Wallet Web App
                            </Link>
                        </Header.Logo>
                        {isAuthenticated && !isLoginPage && (
                            <Header.Content>
                                <TopNav>
                                    <TopNav.Nav>
                                        <TopNav.NavItem>
                                            <Link to="/dashboard">Dashboard</Link>
                                        </TopNav.NavItem>
                                        <TopNav.NavItem>
                                            <Link to="/did">DID Management</Link>
                                        </TopNav.NavItem>
                                        <TopNav.NavItem>
                                            <Link to="/credentials">Credentials</Link>
                                        </TopNav.NavItem>
                                        <TopNav.NavItem>
                                            <Link to="/permissions">Permissions</Link>
                                        </TopNav.NavItem>
                                    </TopNav.Nav>
                                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ color: 'white', fontSize: '14px' }}>
                                            {user?.webid && (
                                                <span title={user.webid}>
                                                    {user.webid.split('/').pop()?.split('#')[0] || 'User'}
                                                </span>
                                            )}
                                        </span>
                                        <Button
                                            buttonColour="white"
                                            buttonTextColour="black"
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </Button>
                                    </div>
                                </TopNav>
                            </Header.Content>
                        )}
                    </Header.Container>
                </Header>
            </GlobalHeader>

            <Main>
                <div className="govuk-width-container">
                    <div className="govuk-main-wrapper">
                        {children}
                    </div>
                </div>
            </Main>

            <Footer>
                <Footer.Content>
                    <Footer.Copyright>
                        © Crown copyright 2025 - Wallet Web App Prototype
                    </Footer.Copyright>
                    <Footer.Meta>
                        <Footer.MetaItem>
                            <Link to="/help">Help</Link>
                        </Footer.MetaItem>
                        <Footer.MetaItem>
                            <Link to="/privacy">Privacy</Link>
                        </Footer.MetaItem>
                        <Footer.MetaItem>
                            <Link to="/terms">Terms</Link>
                        </Footer.MetaItem>
                    </Footer.Meta>
                </Footer.Content>
            </Footer>
        </>
    );
};

export default Layout;
