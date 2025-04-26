// src/components/Card.js

import React from 'react';
import styled from 'styled-components';
import { colors } from '../utils/constants';

/**
 * Componente Card para mostrar contenido en forma de tarjeta
 *
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Contenido de la tarjeta
 * @param {string} props.title - Título de la tarjeta
 * @param {function} props.onClick - Función a ejecutar al presionar la tarjeta (si es presionable)
 * @param {boolean} props.pressable - Si la tarjeta es presionable
 * @param {React.ReactNode} props.footer - Contenido del pie de la tarjeta
 * @param {string} props.className - Clases CSS adicionales
 */
const Card = ({
  children,
  title,
  onClick,
  pressable = false,
  footer,
  className,
  ...props
}) => {
  // Contenido de la tarjeta
  const cardContent = (
    <StyledCard className={className} {...props}>
      {title && <CardTitle>{title}</CardTitle>}
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </StyledCard>
  );

  // Si es presionable, envolver en un componente clickeable
  if (pressable && onClick) {
    return <PressableWrapper onClick={onClick}>{cardContent}</PressableWrapper>;
  }

  return cardContent;
};

// Subcomponentes
Card.Header = ({ children, className }) => (
  <CardHeader className={className}>{children}</CardHeader>
);

Card.Body = ({ children, className }) => (
  <CardBody className={className}>{children}</CardBody>
);

Card.Footer = ({ children, className }) => (
  <CardFooterContainer className={className}>{children}</CardFooterContainer>
);

Card.Text = ({ children, className }) => (
  <CardText className={className}>{children}</CardText>
);

// Estilos con styled-components
const StyledCard = styled.div`
  background-color: ${colors.white};
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
  overflow: hidden;
  transition: all 0.2s ease;
`;

const PressableWrapper = styled.div`
  cursor: pointer;
  border-radius: 12px;
  margin-bottom: 24px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CardTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text};
  padding: 16px;
  border-bottom: 1px solid ${colors.border};
`;

const CardContent = styled.div`
  padding: 16px;
`;

const CardFooter = styled.div`
  padding: 16px;
  border-top: 1px solid ${colors.border};
`;

const CardHeader = styled.div`
  margin-bottom: 16px;
`;

const CardBody = styled.div`
  margin-bottom: 16px;
`;

const CardFooterContainer = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${colors.border};
  display: flex;
  justify-content: flex-end;
`;

const CardText = styled.p`
  font-size: 14px;
  color: ${colors.text};
  line-height: 1.5;
  margin: 0 0 12px 0;

  &:last-child {
    margin-bottom: 0;
  }
`;

export default Card;
