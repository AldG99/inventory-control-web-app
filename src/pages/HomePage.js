import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../context/AuthContext';
import { InventoryContext } from '../context/InventoryContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseService';
import { COLLECTIONS } from '../utils/constants';
import { colors } from '../utils/constants';
import Card from '../components/Card';

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const { products, loading: productsLoading } = useContext(InventoryContext);
  const [recentSales, setRecentSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estadísticas del inventario
  const totalProducts = products.length;
  const totalItems = products.reduce(
    (sum, product) => sum + (product.quantity || 0),
    0
  );
  const lowStockProducts = products.filter(
    product => product.quantity <= 5
  ).length;

  // Calcular el valor total del inventario (precio * cantidad)
  const inventoryValue = products.reduce(
    (sum, product) => sum + (product.price || 0) * (product.quantity || 0),
    0
  );

  // Cargar ventas recientes
  const loadRecentSales = async () => {
    try {
      setSalesLoading(true);
      // Crear una consulta para obtener las 5 ventas más recientes
      const salesQuery = query(
        collection(db, COLLECTIONS.SALES),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const snapshot = await getDocs(salesQuery);
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(), // Convertir timestamp a Date
      }));

      setRecentSales(salesData);
    } catch (error) {
      console.error('Error al cargar ventas recientes:', error);
    } finally {
      setSalesLoading(false);
    }
  };

  // Cargar ventas al montar el componente
  useEffect(() => {
    loadRecentSales();
  }, []);

  // Función para refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentSales();
    setRefreshing(false);
  };

  // Formatear fecha
  const formatDate = date => {
    if (!date) return 'Fecha desconocida';
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formatear moneda
  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <PageContainer>
      <PageHeader>
        <WelcomeSection>
          <h1>Hola, {user?.name || 'Usuario'}</h1>
          <p>{user?.businessName || 'Tu Negocio'}</p>
        </WelcomeSection>
        <AddProductButton to="/add-product">
          <i className="fas fa-plus"></i>
          <span>Añadir Producto</span>
        </AddProductButton>
      </PageHeader>

      {/* Tarjetas de resumen */}
      <SummaryGrid>
        <SummaryCard background={colors.primary}>
          <CardContent>
            <CardTitle>Productos</CardTitle>
            <CardValue>{totalProducts}</CardValue>
          </CardContent>
          <CardIcon>
            <i className="fas fa-cube"></i>
          </CardIcon>
        </SummaryCard>

        <SummaryCard background={colors.info}>
          <CardContent>
            <CardTitle>Unidades</CardTitle>
            <CardValue>{totalItems}</CardValue>
          </CardContent>
          <CardIcon>
            <i className="fas fa-layer-group"></i>
          </CardIcon>
        </SummaryCard>

        <SummaryCard background={colors.warning}>
          <CardContent>
            <CardTitle>Stock Bajo</CardTitle>
            <CardValue>{lowStockProducts}</CardValue>
          </CardContent>
          <CardIcon>
            <i className="fas fa-exclamation-circle"></i>
          </CardIcon>
        </SummaryCard>

        <SummaryCard background={colors.success}>
          <CardContent>
            <CardTitle>Valor</CardTitle>
            <CardValue>{formatCurrency(inventoryValue)}</CardValue>
          </CardContent>
          <CardIcon>
            <i className="fas fa-money-bill-wave"></i>
          </CardIcon>
        </SummaryCard>
      </SummaryGrid>

      {/* Sección de Accesos Rápidos */}
      <SectionContainer>
        <SectionHeader>
          <SectionTitle>Accesos Rápidos</SectionTitle>
        </SectionHeader>

        <QuickLinks>
          <QuickLink to="/inventory">
            <QuickLinkIcon background={`${colors.primary}15`}>
              <i className="fas fa-list" style={{ color: colors.primary }}></i>
            </QuickLinkIcon>
            <QuickLinkText>Inventario</QuickLinkText>
          </QuickLink>

          <QuickLink to="/sales">
            <QuickLinkIcon background="#FFF0E0">
              <i
                className="fas fa-shopping-cart"
                style={{ color: colors.secondary }}
              ></i>
            </QuickLinkIcon>
            <QuickLinkText>Nueva Venta</QuickLinkText>
          </QuickLink>

          <QuickLink to="/sales-history">
            <QuickLinkIcon background="#E6F2FF">
              <i className="fas fa-history" style={{ color: colors.info }}></i>
            </QuickLinkIcon>
            <QuickLinkText>Historial</QuickLinkText>
          </QuickLink>

          <QuickLink to="/reports">
            <QuickLinkIcon background="#E8F5E9">
              <i
                className="fas fa-chart-bar"
                style={{ color: colors.success }}
              ></i>
            </QuickLinkIcon>
            <QuickLinkText>Reportes</QuickLinkText>
          </QuickLink>
        </QuickLinks>
      </SectionContainer>

      <ContentGrid>
        {/* Ventas Recientes */}
        <SectionCard>
          <SectionHeader>
            <SectionTitle>Ventas Recientes</SectionTitle>
            <ViewAllLink to="/sales-history">Ver todas</ViewAllLink>
          </SectionHeader>

          {salesLoading ? (
            <LoadingContainer>
              <LoadingSpinner />
              <LoadingText>Cargando ventas...</LoadingText>
            </LoadingContainer>
          ) : recentSales.length > 0 ? (
            <SalesList>
              {recentSales.map(sale => (
                <SaleItem key={sale.id}>
                  <SaleInfo>
                    <SaleId>Venta #{sale.id.slice(-6)}</SaleId>
                    <SaleDate>
                      {sale.createdAt
                        ? formatDate(sale.createdAt)
                        : 'Fecha no disponible'}
                    </SaleDate>
                    <SaleItemsCount>
                      {sale.items?.length || 0} productos
                    </SaleItemsCount>
                  </SaleInfo>
                  <SaleTotal>{formatCurrency(sale.total || 0)}</SaleTotal>
                </SaleItem>
              ))}
            </SalesList>
          ) : (
            <EmptyState>
              <EmptyText>No hay ventas recientes</EmptyText>
            </EmptyState>
          )}
        </SectionCard>

        {/* Productos con Bajo Stock */}
        <SectionCard>
          <SectionHeader>
            <SectionTitle>Productos con Bajo Stock</SectionTitle>
            <ViewAllLink to="/inventory">Ver todos</ViewAllLink>
          </SectionHeader>

          {productsLoading ? (
            <LoadingContainer>
              <LoadingSpinner />
              <LoadingText>Cargando productos...</LoadingText>
            </LoadingContainer>
          ) : products.filter(p => p.quantity <= 5).length > 0 ? (
            <LowStockList>
              {products
                .filter(product => product.quantity <= 5)
                .slice(0, 5)
                .map(product => (
                  <LowStockItem key={product.id} to={`/products/${product.id}`}>
                    <ProductInfo>
                      <ProductName>{product.name}</ProductName>
                      <ProductSku>SKU: {product.sku || 'N/A'}</ProductSku>
                    </ProductInfo>
                    <QuantityContainer>
                      <QuantityText
                        status={product.quantity <= 0 ? 'out' : 'low'}
                      >
                        {product.quantity <= 0
                          ? 'Agotado'
                          : `${product.quantity} uds.`}
                      </QuantityText>
                    </QuantityContainer>
                  </LowStockItem>
                ))}
            </LowStockList>
          ) : (
            <EmptyState>
              <EmptyText>No hay productos con bajo stock</EmptyText>
            </EmptyState>
          )}
        </SectionCard>
      </ContentGrid>
    </PageContainer>
  );
};

// Estilos
const PageContainer = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const PageHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const WelcomeSection = styled.div`
  h1 {
    font-size: 24px;
    font-weight: bold;
    color: ${colors.text};
    margin-bottom: 4px;
  }

  p {
    font-size: 16px;
    color: ${colors.primary};
    font-weight: 500;
  }
`;

const AddProductButton = styled(Link)`
  display: flex;
  align-items: center;
  background-color: ${colors.primary};
  color: ${colors.white};
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
  text-decoration: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  i {
    margin-right: 8px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const SummaryCard = styled.div`
  background-color: ${props => props.background || colors.primary};
  border-radius: 10px;
  padding: 20px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-4px);
  }
`;

const CardContent = styled.div`
  flex: 1;
`;

const CardTitle = styled.div`
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
`;

const CardValue = styled.div`
  font-size: 28px;
  font-weight: bold;
`;

const CardIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  opacity: 0.8;
`;

const QuickLinks = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const QuickLink = styled(Link)`
  background-color: white;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid ${colors.border};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  }
`;

const QuickLinkIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: ${props => props.background || colors.primary + '20'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  font-size: 24px;
`;

const QuickLinkText = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${colors.text};
`;

const SectionContainer = styled.section`
  background-color: white;
  border-radius: 10px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 24px;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const SectionCard = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text};
`;

const ViewAllLink = styled(Link)`
  color: ${colors.primary};
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;

  &:hover {
    text-decoration: underline;
  }

  &::after {
    content: '›';
    margin-left: 4px;
    font-size: 18px;
  }
`;

const SalesList = styled.div`
  margin-top: 8px;
`;

const SaleItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid ${colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const SaleInfo = styled.div`
  flex: 1;
`;

const SaleId = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 4px;
`;

const SaleDate = styled.div`
  font-size: 14px;
  color: ${colors.textLight};
  margin-bottom: 4px;
`;

const SaleItemsCount = styled.div`
  font-size: 14px;
  color: ${colors.textLight};
`;

const SaleTotal = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.success};
`;

const LowStockList = styled.div`
  margin-top: 8px;
`;

const LowStockItem = styled(Link)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid ${colors.border};
  text-decoration: none;
  color: ${colors.text};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${colors.background};
  }
`;

const ProductInfo = styled.div`
  flex: 1;
`;

const ProductName = styled.div`
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const ProductSku = styled.div`
  font-size: 14px;
  color: ${colors.textLight};
`;

const QuantityContainer = styled.div`
  margin-left: 12px;
`;

const QuantityText = styled.div`
  font-size: 14px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: ${props =>
    props.status === 'out' ? `${colors.danger}15` : `${colors.warning}15`};
  color: ${props => (props.status === 'out' ? colors.danger : colors.warning)};
`;

const EmptyState = styled.div`
  padding: 24px;
  text-align: center;
`;

const EmptyText = styled.div`
  color: ${colors.textLight};
  font-size: 15px;
`;

const LoadingContainer = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${colors.primary}30;
  border-top: 3px solid ${colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;

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
  color: ${colors.textLight};
  font-size: 15px;
`;

export default HomePage;
