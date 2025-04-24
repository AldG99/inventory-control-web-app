// src/components/Button.js

import React from 'react';
import styled from 'styled-components';
import { colors } from '../utils/constants';

/**
 * Componente de botón reutilizable con diferentes variantes
 *
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Texto del botón
 * @param {function} props.onClick - Función a ejecutar al presionar
 * @param {string} props.variant - Variante del botón (primary, secondary, danger, success, outline)
 * @param {string} props.size - Tamaño del botón (small, medium, large)
 * @param {boolean} props.fullWidth - Si el botón ocupa todo el ancho disponible
 * @param {boolean} props.disabled - Si el botón está deshabilitado
 * @param {boolean} props.loading - Si muestra un indicador de carga
 * @param {string} props.iconLeft - Icono a mostrar a la izquierda (nombre de la clase de icono)
 * @param {string} props.iconRight - Icono a mostrar a la derecha (nombre de la clase de icono)
 */
const Button = ({
  title,
  onClick,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  className,
  ...props
}) => {
  // Renderizar el contenido del botón
  const renderContent = () => {
    if (loading) {
      return (
        <LoadingContainer>
          <span>Cargando...</span>
          <DotsContainer>
            <Dot delay="0s" />
            <Dot delay="0.2s" />
            <Dot delay="0.4s" />
          </DotsContainer>
        </LoadingContainer>
      );
    }

    return (
      <ContentContainer>
        {iconLeft && <Icon className={iconLeft} position="left" />}
        <span>{title}</span>
        {iconRight && <Icon className={iconRight} position="right" />}
      </ContentContainer>
    );
  };

  return (
    <StyledButton
      onClick={onClick}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      className={className}
      {...props}
    >
      {renderContent()}
    </StyledButton>
  );
};

// Estilos con styled-components
const StyledButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: ${props => (props.fullWidth ? '100%' : 'auto')};

  /* Variantes */
  background-color: ${props => {
    if (props.disabled) return colors.disabled;
    switch (props.variant) {
      case 'secondary':
        return colors.secondary;
      case 'danger':
        return colors.danger;
      case 'success':
        return colors.success;
      case 'outline':
        return 'transparent';
      case 'primary':
      default:
        return colors.primary;
    }
  }};

  color: ${props => {
    if (props.disabled) return colors.textLight;
    return props.variant === 'outline' ? colors.primary : colors.white;
  }};

  border: ${props =>
    props.variant === 'outline' ? `1px solid ${colors.primary}` : 'none'};

  /* Tamaños */
  height: ${props => {
    switch (props.size) {
      case 'small':
        return '36px';
      case 'large':
        return '48px';
      case 'medium':
      default:
        return '42px';
    }
  }};

  padding: ${props => {
    switch (props.size) {
      case 'small':
        return '0 12px';
      case 'large':
        return '0 24px';
      case 'medium':
      default:
        return '0 16px';
    }
  }};

  font-size: ${props => {
    switch (props.size) {
      case 'small':
        return '14px';
      case 'large':
        return '16px';
      case 'medium':
      default:
        return '15px';
    }
  }};

  &:hover {
    opacity: ${props => (props.disabled ? 1 : 0.9)};
    transform: ${props => (props.disabled ? 'none' : 'translateY(-1px)')};
    box-shadow: ${props =>
      props.disabled ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.1)'};
  }

  &:active {
    opacity: ${props => (props.disabled ? 1 : 0.8)};
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const ContentContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Icon = styled.i`
  margin-left: ${props => (props.position === 'right' ? '8px' : '0')};
  margin-right: ${props => (props.position === 'left' ? '8px' : '0')};
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
`;

const DotsContainer = styled.div`
  display: flex;
  margin-left: 8px;
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  margin: 0 2px;
  opacity: 0.6;
  animation: pulse 1s infinite;
  animation-delay: ${props => props.delay};

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
  }
`;

export default Button;
