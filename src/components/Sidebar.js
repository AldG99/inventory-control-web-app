import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../utils/constants';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);

  // Navegación principal
  const navItems = [
    { name: 'Inicio', path: '/', icon: 'fas fa-home' },
    { name: 'Inventario', path: '/inventory', icon: 'fas fa-box' },
    { name: 'Ventas', path: '/sales', icon: 'fas fa-shopping-cart' },
    { name: 'Historial', path: '/sales-history', icon: 'fas fa-history' },
    { name: 'Reportes', path: '/reports', icon: 'fas fa-chart-bar' },
    { name: 'Análisis', path: '/analytics', icon: 'fas fa-chart-line' },
    { name: 'Ajustes', path: '/settings', icon: 'fas fa-cog' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <SidebarContainer expanded={expanded}>
      <LogoSection>
        <Logo expanded={expanded}>{expanded ? 'InventoryPro' : 'IP'}</Logo>
        <ToggleButton onClick={() => setExpanded(!expanded)}>
          <i
            className={`fas fa-${expanded ? 'chevron-left' : 'chevron-right'}`}
          />
        </ToggleButton>
      </LogoSection>

      <UserSection expanded={expanded}>
        <UserAvatar>
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </UserAvatar>
        {expanded && (
          <UserInfo>
            <UserName>{user?.name || 'Usuario'}</UserName>
            <UserEmail>{user?.email}</UserEmail>
          </UserInfo>
        )}
      </UserSection>

      <NavSection>
        {navItems.map(item => (
          <NavItem
            key={item.path}
            as={Link}
            to={item.path}
            active={location.pathname === item.path ? 'true' : 'false'}
            expanded={expanded}
          >
            <NavIcon className={item.icon} />
            {expanded && <NavText>{item.name}</NavText>}
          </NavItem>
        ))}
      </NavSection>

      <LogoutButton onClick={handleLogout} expanded={expanded}>
        <i className="fas fa-sign-out-alt" />
        {expanded && <span>Cerrar Sesión</span>}
      </LogoutButton>
    </SidebarContainer>
  );
};

// Estilos
const SidebarContainer = styled.aside`
  width: ${props => (props.expanded ? '250px' : '70px')};
  background-color: ${colors.white};
  border-right: 1px solid ${colors.border};
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow-x: hidden;
  z-index: 10;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid ${colors.border};
`;

const Logo = styled.div`
  font-size: ${props => (props.expanded ? '24px' : '20px')};
  font-weight: 700;
  color: ${colors.primary};
  white-space: nowrap;
  overflow: hidden;
`;

const ToggleButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${colors.background};
  color: ${colors.text};
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${colors.primary}20;
    color: ${colors.primary};
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => (props.expanded ? '16px 20px' : '16px 10px')};
  border-bottom: 1px solid ${colors.border};
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  margin-left: 12px;
  overflow: hidden;
`;

const UserName = styled.div`
  font-weight: 600;
  color: ${colors.text};
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserEmail = styled.div`
  font-size: 12px;
  color: ${colors.textLight};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NavSection = styled.nav`
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${colors.border};
    border-radius: 3px;
  }
`;

const NavItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: ${props => (props.expanded ? '12px 20px' : '12px')};
  justify-content: ${props => (props.expanded ? 'flex-start' : 'center')};
  color: ${props => (props.active === 'true' ? colors.primary : colors.text)};
  background-color: ${props =>
    props.active === 'true' ? colors.primary + '10' : 'transparent'};
  text-decoration: none;
  font-weight: ${props => (props.active === 'true' ? '600' : 'normal')};
  border-left: ${props =>
    props.active === 'true'
      ? `3px solid ${colors.primary}`
      : '3px solid transparent'};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${colors.background};
    color: ${colors.primary};
  }
`;

const NavIcon = styled.i`
  font-size: 18px;
  width: 24px;
  text-align: center;
`;

const NavText = styled.span`
  margin-left: 12px;
  white-space: nowrap;
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: ${props => (props.expanded ? 'flex-start' : 'center')};
  padding: ${props => (props.expanded ? '16px 20px' : '16px')};
  background-color: transparent;
  color: ${colors.danger};
  border: none;
  border-top: 1px solid ${colors.border};
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;

  & > i {
    font-size: 18px;
    width: 24px;
    text-align: center;
  }

  & > span {
    margin-left: 12px;
    white-space: nowrap;
  }

  &:hover {
    background-color: ${colors.danger}10;
  }
`;

export default Sidebar;
