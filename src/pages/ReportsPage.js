import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { InventoryContext } from '../context/InventoryContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebaseService';
import { COLLECTIONS, colors } from '../utils/constants';

const ReportsPage = () => {
  const { products } = useContext(InventoryContext);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [periodFilter, setPeriodFilter] = useState('week'); // 'day', 'week', 'month', 'year'

  // Estadísticas de inventario
  const totalProducts = products.length;
  const totalItems = products.reduce(
    (sum, product) => sum + (product.quantity || 0),
    0
  );
  const lowStockProducts = products.filter(
    product => product.quantity <= 5
  ).length;
  const outOfStockProducts = products.filter(
    product => product.quantity <= 0
  ).length;

  // Calcular el valor total del inventario (precio * cantidad)
  const inventoryValue = products.reduce(
    (sum, product) => sum + (product.price || 0) * (product.quantity || 0),
    0
  );

  // Cargar datos de ventas según el filtro de periodo
  useEffect(() => {
    const loadSalesData = async () => {
      try {
        setLoading(true);

        // Calcular fecha de inicio según el filtro
        const startDate = new Date();
        if (periodFilter === 'day') {
          startDate.setHours(0, 0, 0, 0); // Inicio del día actual
        } else if (periodFilter === 'week') {
          startDate.setDate(startDate.getDate() - 7); // 7 días atrás
        } else if (periodFilter === 'month') {
          startDate.setMonth(startDate.getMonth() - 1); // 1 mes atrás
        } else if (periodFilter === 'year') {
          startDate.setFullYear(startDate.getFullYear() - 1); // 1 año atrás
        }

        // Consultar ventas en el periodo seleccionado
        const salesQuery = query(
          collection(db, COLLECTIONS.SALES),
          where('createdAt', '>=', startDate),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(salesQuery);
        const salesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(), // Convertir timestamp a Date
        }));

        setSalesData(salesData);
      } catch (error) {
        console.error('Error al cargar datos de ventas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSalesData();
  }, [periodFilter]);

  // Calcular estadísticas de ventas
  const totalSales = salesData.length;
  const totalRevenue = salesData.reduce(
    (sum, sale) => sum + (sale.total || 0),
    0
  );
  const totalItemsSold = salesData.reduce((sum, sale) => {
    return (
      sum +
      (sale.items?.reduce(
        (itemSum, item) => itemSum + (item.quantity || 0),
        0
      ) || 0)
    );
  }, 0);

  // Ventas agrupadas por método de pago
  const salesByPaymentMethod = salesData.reduce((acc, sale) => {
    const method = sale.paymentMethod || 'Efectivo';
    if (!acc[method]) {
      acc[method] = { count: 0, total: 0 };
    }
    acc[method].count += 1;
    acc[method].total += sale.total || 0;
    return acc;
  }, {});

  // Formatear moneda
  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Obtener título del periodo
  const getPeriodTitle = () => {
    switch (periodFilter) {
      case 'day':
        return 'Hoy';
      case 'week':
        return 'Últimos 7 días';
      case 'month':
        return 'Último mes';
      case 'year':
        return 'Último año';
      default:
        return 'Últimos 7 días';
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <HeaderTitle>Reportes y Estadísticas</HeaderTitle>
        <AnalyticsLink to="/analytics">
          <i className="fas fa-chart-line"></i>
          <span>Análisis Avanzado</span>
        </AnalyticsLink>
      </PageHeader>

      <FiltersSection>
        <PeriodTitle>Periodo: {getPeriodTitle()}</PeriodTitle>
        <PeriodOptions>
          <PeriodOption
            selected={periodFilter === 'day'}
            onClick={() => setPeriodFilter('day')}
          >
            Día
          </PeriodOption>
          <PeriodOption
            selected={periodFilter === 'week'}
            onClick={() => setPeriodFilter('week')}
          >
            Semana
          </PeriodOption>
          <PeriodOption
            selected={periodFilter === 'month'}
            onClick={() => setPeriodFilter('month')}
          >
            Mes
          </PeriodOption>
          <PeriodOption
            selected={periodFilter === 'year'}
            onClick={() => setPeriodFilter('year')}
          >
            Año
          </PeriodOption>
        </PeriodOptions>
      </FiltersSection>

      {loading ? (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Cargando datos...</LoadingText>
        </LoadingContainer>
      ) : (
        <ReportsGrid>
          {/* Resumen de Ventas */}
          <ReportCard>
            <CardHeader>
              <CardTitle>Resumen de Ventas</CardTitle>
              <ViewMoreLink to="/sales-history">
                <span>Ver historial</span>
                <i className="fas fa-chevron-right"></i>
              </ViewMoreLink>
            </CardHeader>

            <StatsSummary>
              <StatCard color={colors.primary}>
                <StatIcon>
                  <i className="fas fa-shopping-cart"></i>
                </StatIcon>
                <StatContent>
                  <StatValue>{totalSales}</StatValue>
                  <StatLabel>Ventas</StatLabel>
                </StatContent>
              </StatCard>

              <StatCard color={colors.success}>
                <StatIcon>
                  <i className="fas fa-money-bill-wave"></i>
                </StatIcon>
                <StatContent>
                  <StatValue>{formatCurrency(totalRevenue)}</StatValue>
                  <StatLabel>Ingresos</StatLabel>
                </StatContent>
              </StatCard>

              <StatCard color={colors.info}>
                <StatIcon>
                  <i className="fas fa-box"></i>
                </StatIcon>
                <StatContent>
                  <StatValue>{totalItemsSold}</StatValue>
                  <StatLabel>Productos vendidos</StatLabel>
                </StatContent>
              </StatCard>
            </StatsSummary>

            {/* Ventas por método de pago */}
            <SectionTitle>Por Método de Pago</SectionTitle>
            {Object.keys(salesByPaymentMethod).length > 0 ? (
              <PaymentMethodsList>
                {Object.entries(salesByPaymentMethod).map(([method, data]) => (
                  <PaymentMethodItem key={method}>
                    <PaymentMethodInfo>
                      <PaymentIcon>
                        <i
                          className={
                            method === 'Efectivo'
                              ? 'fas fa-money-bill-wave'
                              : method === 'Tarjeta'
                              ? 'fas fa-credit-card'
                              : 'fas fa-exchange-alt'
                          }
                        />
                      </PaymentIcon>
                      <PaymentName>{method}</PaymentName>
                    </PaymentMethodInfo>
                    <PaymentCount>{data.count} ventas</PaymentCount>
                    <PaymentTotal>{formatCurrency(data.total)}</PaymentTotal>
                  </PaymentMethodItem>
                ))}
              </PaymentMethodsList>
            ) : (
              <NoDataMessage>No hay ventas en este periodo</NoDataMessage>
            )}
          </ReportCard>

          {/* Resumen de Inventario */}
          <ReportCard>
            <CardHeader>
              <CardTitle>Resumen de Inventario</CardTitle>
              <ViewMoreLink to="/inventory">
                <span>Ver inventario</span>
                <i className="fas fa-chevron-right"></i>
              </ViewMoreLink>
            </CardHeader>

            <StatsSummary>
              <StatCard color={colors.primary}>
                <StatIcon>
                  <i className="fas fa-tag"></i>
                </StatIcon>
                <StatContent>
                  <StatValue>{totalProducts}</StatValue>
                  <StatLabel>Productos</StatLabel>
                </StatContent>
              </StatCard>

              <StatCard color={colors.info}>
                <StatIcon>
                  <i className="fas fa-layer-group"></i>
                </StatIcon>
                <StatContent>
                  <StatValue>{totalItems}</StatValue>
                  <StatLabel>Unidades</StatLabel>
                </StatContent>
              </StatCard>

              <StatCard color={colors.success}>
                <StatIcon>
                  <i className="fas fa-wallet"></i>
                </StatIcon>
                <StatContent>
                  <StatValue>{formatCurrency(inventoryValue)}</StatValue>
                  <StatLabel>Valor</StatLabel>
                </StatContent>
              </StatCard>
            </StatsSummary>

            <SectionTitle>Estado del Inventario</SectionTitle>

            <InventoryStatusItem>
              <StatusIndicator color={colors.warning} />
              <StatusInfo>
                <StatusName>Stock Bajo</StatusName>
                <StatusCount>{lowStockProducts} productos</StatusCount>
              </StatusInfo>
            </InventoryStatusItem>

            <InventoryStatusItem>
              <StatusIndicator color={colors.danger} />
              <StatusInfo>
                <StatusName>Agotados</StatusName>
                <StatusCount>{outOfStockProducts} productos</StatusCount>
              </StatusInfo>
            </InventoryStatusItem>
          </ReportCard>

          {/* Recomendaciones */}
          <ReportCard gridColumn="1 / -1">
            <CardTitle>Recomendaciones</CardTitle>

            <RecommendationList>
              <RecommendationCard background={`${colors.primary}10`}>
                <RecommendationIcon color={colors.primary}>
                  <i className="fas fa-chart-line"></i>
                </RecommendationIcon>
                <RecommendationContent>
                  <RecommendationTitle>Análisis Avanzado</RecommendationTitle>
                  <RecommendationText>
                    Obtén predicciones de ventas y descubre patrones en tu
                    negocio
                  </RecommendationText>
                  <RecommendationLink to="/analytics">
                    Ver análisis
                  </RecommendationLink>
                </RecommendationContent>
              </RecommendationCard>

              {lowStockProducts > 0 && (
                <RecommendationCard background={`${colors.warning}10`}>
                  <RecommendationIcon color={colors.warning}>
                    <i className="fas fa-exclamation-circle"></i>
                  </RecommendationIcon>
                  <RecommendationContent>
                    <RecommendationTitle>
                      Productos con Bajo Stock
                    </RecommendationTitle>
                    <RecommendationText>
                      Tienes {lowStockProducts} productos con poco inventario
                      que deberías reabastecer pronto
                    </RecommendationText>
                    <RecommendationLink to="/inventory">
                      Ver productos
                    </RecommendationLink>
                  </RecommendationContent>
                </RecommendationCard>
              )}
            </RecommendationList>
          </ReportCard>
        </ReportsGrid>
      )}
    </PageContainer>
  );
};

// Estilos
const PageContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const HeaderTitle = styled.h1`
  font-size: 24px;
  font-weight: bold;
  color: ${colors.text};
`;

const AnalyticsLink = styled(Link)`
  display: flex;
  align-items: center;
  background-color: ${colors.primary};
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s ease;

  i {
    margin-right: 8px;
  }

  &:hover {
    background-color: ${colors.primaryDark};
    transform: translateY(-2px);
  }
`;

const FiltersSection = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const PeriodTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 12px;
`;

const PeriodOptions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const PeriodOption = styled.button`
  padding: 8px 16px;
  background-color: ${props => (props.selected ? colors.primary : 'white')};
  color: ${props => (props.selected ? 'white' : colors.text)};
  border: 1px solid
    ${props => (props.selected ? colors.primary : colors.border)};
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props =>
      props.selected ? colors.primary : colors.background};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${colors.primary}30;
  border-top: 3px solid ${colors.primary};
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
  font-size: 16px;
  color: ${colors.textLight};
`;

const ReportsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ReportCard = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  grid-column: ${props => props.gridColumn || 'auto'};
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text};
`;

const ViewMoreLink = styled(Link)`
  display: flex;
  align-items: center;
  color: ${colors.primary};
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;

  span {
    margin-right: 4px;
  }

  &:hover {
    text-decoration: underline;
  }
`;

const StatsSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  background-color: ${props => `${props.color}10` || `${colors.primary}10`};
  padding: 16px;
  border-radius: 8px;
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background-color: ${props => props.color || colors.primary};
  color: white;
  margin-right: 12px;
  font-size: 16px;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${colors.text};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: ${colors.textLight};
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 16px;
  margin-top: 24px;
`;

const PaymentMethodsList = styled.div`
  background-color: ${colors.background};
  border-radius: 8px;
  overflow: hidden;
`;

const PaymentMethodItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid ${colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const PaymentMethodInfo = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const PaymentIcon = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background-color: ${colors.background};
  color: ${colors.textLight};
  margin-right: 12px;
  border: 1px solid ${colors.border};
`;

const PaymentName = styled.div`
  font-weight: 500;
  color: ${colors.text};
`;

const PaymentCount = styled.div`
  font-size: 14px;
  color: ${colors.textLight};
  margin-right: 16px;
`;

const PaymentTotal = styled.div`
  font-weight: 600;
  color: ${colors.text};
  min-width: 100px;
  text-align: right;
`;

const NoDataMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: ${colors.textLight};
  background-color: ${colors.background};
  border-radius: 8px;
`;

const InventoryStatusItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid ${colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const StatusIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: ${props => props.color || colors.primary};
  margin-right: 12px;
`;

const StatusInfo = styled.div`
  display: flex;
  justify-content: space-between;
  flex: 1;
`;

const StatusName = styled.div`
  font-weight: 500;
  color: ${colors.text};
`;

const StatusCount = styled.div`
  color: ${colors.textLight};
  font-weight: 500;
`;

const RecommendationList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const RecommendationCard = styled.div`
  display: flex;
  background-color: ${props => props.background || 'white'};
  border-radius: 8px;
  padding: 16px;
  border: 1px solid ${colors.border};
`;

const RecommendationIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color || colors.primary};
  background-color: white;
  font-size: 20px;
  margin-right: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
`;

const RecommendationContent = styled.div`
  flex: 1;
`;

const RecommendationTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 8px;
`;

const RecommendationText = styled.p`
  font-size: 14px;
  color: ${colors.textLight};
  margin-bottom: 12px;
`;

const RecommendationLink = styled(Link)`
  display: inline-block;
  color: ${colors.primary};
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export default ReportsPage;
