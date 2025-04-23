// src/components/Footer.js
import React from 'react';
import styled from 'styled-components';
import { colors } from '../utils/constants';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer>
      <FooterContent>
        <FooterLogo>INVENTA-ANALYT</FooterLogo>
        <FooterLinks>
          <FooterLink href="#">Términos y Condiciones</FooterLink>
          <FooterLink href="#">Política de Privacidad</FooterLink>
          <FooterLink href="#">Soporte</FooterLink>
        </FooterLinks>
        <FooterCopyright>
          © {currentYear} INVENTA-ANALYT. Todos los derechos reservados.
        </FooterCopyright>
      </FooterContent>
    </FooterContainer>
  );
};

const FooterContainer = styled.footer`
  background-color: ${colors.white};
  border-top: 1px solid ${colors.border};
  padding: 20px 0;
  margin-top: auto;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FooterLogo = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${colors.primary};
  margin-bottom: 16px;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  justify-content: center;
`;

const FooterLink = styled.a`
  color: ${colors.textLight};
  text-decoration: none;
  font-size: 14px;

  &:hover {
    color: ${colors.primary};
    text-decoration: underline;
  }
`;

const FooterCopyright = styled.div`
  font-size: 14px;
  color: ${colors.textLight};
  text-align: center;
`;

export default Footer;
