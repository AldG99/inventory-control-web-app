// src/components/PrivateRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Footer from './Footer';
import styled from 'styled-components';
import { colors } from '../utils/constants';

/**
 * Componente para proteger rutas que requieren autenticación
 * y aplicar el layout con sidebar para páginas autenticadas
 */
const PrivateRoute = ({ component: Component }) => {
  const { user, loading } = useContext(AuthContext);

  // Mientras se verifica la autenticación, mostrar un indicador de carga
  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Cargando...</LoadingText>
      </LoadingContainer>
    );
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, mostrar el componente con el layout principal
  return (
    <AppLayout>
      <Sidebar />
      <MainContainer>
        <MainContent>
          <Component />
        </MainContent>
        <Footer />
      </MainContainer>
    </AppLayout>
  );
};

// Estilos
const AppLayout = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${colors.background};
`;

const MainContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  overflow-y: auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: ${colors.background};
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid ${colors.primary}30;
  border-top: 4px solid ${colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  font-size: 18px;
  color: ${colors.textLight};
`;

export default PrivateRoute;
