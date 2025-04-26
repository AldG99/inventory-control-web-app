// src/pages/auth/LoginPage.js
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../../context/AuthContext';
import { colors } from '../../utils/constants';
import Button from '../../components/Button';
import Footer from '../../components/Footer';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redireccionar si ya hay sesión iniciada
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async e => {
    e.preventDefault();

    if (!email || !password) {
      setError('Por favor, ingresa email y contraseña');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(email, password);
      // No es necesario navegar aquí, el efecto lo hará
    } catch (error) {
      let errorMessage = 'Error al iniciar sesión';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <LoginContainer>
        <FormSection>
          <LogoTitle>InventoryPro</LogoTitle>
          <LogoSubtitle>Gestiona tu negocio fácilmente</LogoSubtitle>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Form onSubmit={handleLogin}>
            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <InputGroup>
                <InputIcon className="fas fa-envelope" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </InputGroup>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="password">Contraseña</Label>
              <InputGroup>
                <InputIcon className="fas fa-lock" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas fa-eye${showPassword ? '-slash' : ''}`} />
                </PasswordToggle>
              </InputGroup>
            </FormGroup>

            <ForgotPasswordLink to="/forgot-password">
              ¿Olvidaste tu contraseña?
            </ForgotPasswordLink>

            <Button
              title="Iniciar Sesión"
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            />
          </Form>

          <SignupText>
            ¿No tienes una cuenta?{' '}
            <SignupLink to="/register">Regístrate</SignupLink>
          </SignupText>
        </FormSection>

        <IllustrationSection>
          <Illustration
            src="/images/inventory-illustration.svg"
            alt="Gestión de inventario"
          />
          <IllustrationText>
            <h2>Gestión de inventario simplificada</h2>
            <p>
              Controla tu stock, registra ventas y accede a reportes detallados.
            </p>
          </IllustrationText>
        </IllustrationSection>
      </LoginContainer>
      <Footer />
    </PageContainer>
  );
};

// Estilos
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: ${colors.background};
`;

const LoginContainer = styled.div`
  display: flex;
  width: 100%;
  max-width: 1100px;
  min-height: 600px;
  background-color: ${colors.white};
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin: 20px auto;

  @media (max-width: 768px) {
    flex-direction: column;
    max-width: 500px;
  }
`;

const FormSection = styled.div`
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 30px;
  }
`;

const IllustrationSection = styled.div`
  flex: 1;
  background-color: ${colors.primary}10;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const Illustration = styled.img`
  max-width: 80%;
  height: auto;
  margin-bottom: 30px;
`;

const IllustrationText = styled.div`
  text-align: center;

  h2 {
    color: ${colors.text};
    margin-bottom: 10px;
    font-size: 24px;
  }

  p {
    color: ${colors.textLight};
    font-size: 16px;
    line-height: 1.5;
  }
`;

const LogoTitle = styled.h1`
  font-size: 36px;
  font-weight: bold;
  color: ${colors.primary};
  margin-bottom: 10px;
  text-align: center;
`;

const LogoSubtitle = styled.p`
  font-size: 16px;
  color: ${colors.textLight};
  margin-bottom: 40px;
  text-align: center;
`;

const Form = styled.form`
  width: 100%;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${colors.text};
  margin-bottom: 8px;
`;

const InputGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.i`
  position: absolute;
  left: 16px;
  color: ${colors.textLight};
`;

const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 16px 0 42px;
  border: 1px solid ${colors.border};
  border-radius: 8px;
  background-color: ${colors.white};
  color: ${colors.text};
  font-size: 16px;
  transition: all 0.2s ease;

  &:focus {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px ${colors.primary}20;
    outline: none;
  }

  &::placeholder {
    color: ${colors.textMuted};
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  color: ${colors.textLight};
  cursor: pointer;

  &:hover {
    color: ${colors.text};
  }
`;

const ForgotPasswordLink = styled(Link)`
  display: block;
  text-align: right;
  color: ${colors.primary};
  font-size: 14px;
  margin-bottom: 24px;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  background-color: ${colors.danger}15;
  color: ${colors.danger};
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;

  &::before {
    content: '\\f071';
    font-family: 'Font Awesome 5 Free';
    font-weight: 900;
    margin-right: 8px;
  }
`;

const SignupText = styled.p`
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: ${colors.textLight};
`;

const SignupLink = styled(Link)`
  color: ${colors.primary};
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export default LoginPage;
