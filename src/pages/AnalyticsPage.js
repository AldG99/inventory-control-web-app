import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { InventoryContext } from '../context/InventoryContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebaseService';
import { COLLECTIONS, colors } from '../utils/constants';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Importar utilidades de análisis
import {
  predictSales,
  getRestockRecommendations,
  getProductPerformance,
  analyzeSeasonalPatterns,
} from '../utils/analysisUtils';

const AnalyticsPage = () => {
  const { products } = useContext(InventoryContext);

  // Estados para los datos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);
  const [salesPrediction, setSalesPrediction] = useState([]);
  const [restockRecommendations, setRestockRecommendations] = useState([]);
  const [productPerformance, setProductPerformance] = useState(null);
  const [seasonalPatterns, setSeasonalPatterns] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(90); // 90 días por defecto
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Estados UI
  const [activeTab, setActiveTab] = useState('predictions');
  const [selectedChart, setSelectedChart] = useState('sales');

  // Cargar datos de ventas
  const loadSalesHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calcular fecha de inicio según el período seleccionado
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - selectedPeriod);

      // Consultar ventas en el período seleccionado
      const salesQuery = query(
        collection(db, COLLECTIONS.SALES),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(salesQuery);
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(), // Convertir timestamp a Date
      }));

      setSalesHistory(salesData);

      // Generar análisis con los datos obtenidos
      analyzeData(salesData, products);
    } catch (err) {
      console.error('Error al cargar historial de ventas:', err);
      setError(
        'Error al cargar datos de ventas. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Generar análisis con los datos cargados
  const analyzeData = (sales, products) => {
    if (!sales || !products) return;

    try {
      // Predicción de ventas
      const predictions = predictSales(sales, 30); // 30 días de predicción
      setSalesPrediction(predictions);

      // Recomendaciones de reabastecimiento
      const restock = getRestockRecommendations(products, sales, 14); // Umbral de 14 días
      setRestockRecommendations(restock);

      // Análisis de rendimiento de productos
      const performance = getProductPerformance(products, sales, {
        period: selectedPeriod,
        categoryId: selectedCategory,
      });
      setProductPerformance(performance);

      // Patrones estacionales
      const patterns = analyzeSeasonalPatterns(sales);
      setSeasonalPatterns(patterns);
    } catch (err) {
      console.error('Error al analizar datos:', err);
      setError('Error al generar análisis avanzado.');
    }
  };

  // Cargar datos cuando cambia el período
  useEffect(() => {
    loadSalesHistory();
  }, [selectedPeriod, products]);

  // Formatear moneda
  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Preparar datos para el gráfico de predicciones
  const getSalesPredictionChartData = () => {
    if (!salesPrediction || salesPrediction.length === 0) {
      return { labels: [], datasets: [{ data: [] }] };
    }

    // Obtener hasta 14 días para mostrar (7 pasados + 7 futuros)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const historicalData = salesPrediction
      .filter(item => !item.predicted)
      .slice(-7);

    const predictedData = salesPrediction
      .filter(item => item.predicted)
      .slice(0, 7);

    const chartData = [...historicalData, ...predictedData].map(item => ({
      date: item.date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
      }),
      value: item.total,
      predicted: item.predicted,
    }));

    return chartData;
  };

  // Preparar datos para el gráfico de patrones estacionales
  const getSeasonalChartData = () => {
    if (!seasonalPatterns || !seasonalPatterns.byDayOfWeek) {
      return [];
    }

    return seasonalPatterns.byDayOfWeek.map(day => ({
      name: day.dayName.substring(0, 3),
      value: day.total,
    }));
  };

  // Calcular totales para predicciones
  const getTotalPredictions = () => {
    if (!salesPrediction || salesPrediction.length === 0) return 0;

    return salesPrediction
      .filter(item => item.predicted)
      .reduce((sum, item) => sum + item.total, 0);
  };

  const predictedTotal = getTotalPredictions();

  // Renderizar contenido según la pestaña activa
  const renderTabContent = () => {
    if (loading) {
      return (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Generando análisis avanzado...</LoadingText>
        </LoadingContainer>
      );
    }

    if (error) {
      return (
        <ErrorContainer>
          <ErrorIcon className="fas fa-exclamation-circle" />
          <ErrorText>{error}</ErrorText>
          <RetryButton onClick={loadSalesHistory}>Reintentar</RetryButton>
        </ErrorContainer>
      );
    }

    switch (activeTab) {
      case 'predictions':
        return renderPredictionsTab();
      case 'restock':
        return renderRestockTab();
      case 'performance':
        return renderPerformanceTab();
      case 'seasonal':
        return renderSeasonalTab();
      default:
        return renderPredictionsTab();
    }
  };

  // Pestaña de predicciones de ventas
  const renderPredictionsTab = () => {
    const chartData = getSalesPredictionChartData();

    return (
      <TabContainer>
        <ChartSection>
          <SectionTitle>Tendencia de Ventas (Próximos 7 días)</SectionTitle>

          {chartData.length > 0 ? (
            <ChartContainer>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={value => [formatCurrency(value), 'Ventas']}
                    labelFormatter={value => `Fecha: ${value}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={colors.primary}
                    activeDot={{ r: 8 }}
                    name="Ventas"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>

              <ChartLegend>
                <LegendItem>
                  <LegendColor color={colors.success} />
                  <LegendText>Datos históricos</LegendText>
                </LegendItem>
                <LegendItem>
                  <LegendColor color={colors.primary} />
                  <LegendText>Predicción</LegendText>
                </LegendItem>
              </ChartLegend>
            </ChartContainer>
          ) : (
            <NoDataChart>
              <p>No hay suficientes datos para generar predicciones.</p>
            </NoDataChart>
          )}
        </ChartSection>

        <PredictionSummary>
          <SummaryCard>
            <SummaryTitle>Ventas Previstas</SummaryTitle>
            <SummaryValue>{formatCurrency(predictedTotal)}</SummaryValue>
            <SummarySubtitle>Próximos 7 días</SummarySubtitle>
          </SummaryCard>

          <SummaryCard>
            <SummaryTitle>Ventas Diarias</SummaryTitle>
            <SummaryValue>{formatCurrency(predictedTotal / 7)}</SummaryValue>
            <SummarySubtitle>Promedio proyectado</SummarySubtitle>
          </SummaryCard>
        </PredictionSummary>

        <InfoContainer>
          <InfoIcon className="fas fa-info-circle" />
          <InfoText>
            Las predicciones se basan en el historial de ventas y patrones
            identificados. Actualice regularmente para mejorar la precisión.
          </InfoText>
        </InfoContainer>
      </TabContainer>
    );
  };

  // Pestaña de recomendaciones de reabastecimiento
  const renderRestockTab = () => {
    if (!restockRecommendations || restockRecommendations.length === 0) {
      return (
        <EmptyContainer>
          <EmptyIcon className="fas fa-check-circle" />
          <EmptyTitle>Inventario Saludable</EmptyTitle>
          <EmptyText>
            No hay productos que necesiten reabastecimiento urgente.
          </EmptyText>
        </EmptyContainer>
      );
    }

    return (
      <TabContainer>
        <SectionHeader>
          <SectionTitle>Recomendaciones de Reabastecimiento</SectionTitle>
          <SectionSubtitle>
            Basado en la tasa de venta y stock actual
          </SectionSubtitle>
        </SectionHeader>

        <RestockList>
          {restockRecommendations.map(item => (
            <RestockItem key={item.id} urgency={item.urgency}>
              <RestockInfo>
                <RestockName>{item.name}</RestockName>
                <RestockSku>SKU: {item.sku || 'N/A'}</RestockSku>
                <RestockMetrics>
                  <MetricLabel>Stock actual:</MetricLabel>
                  <MetricValue>{item.quantity} unidades</MetricValue>
                </RestockMetrics>
                <RestockMetrics>
                  <MetricLabel>Ventas diarias:</MetricLabel>
                  <MetricValue>{item.dailySalesRate} unid/día</MetricValue>
                </RestockMetrics>
              </RestockInfo>
              <RestockAction>
                <DaysLabel>
                  {item.daysUntilOutOfStock <= 0
                    ? 'Agotado'
                    : `${item.daysUntilOutOfStock} días hasta agotarse`}
                </DaysLabel>
                <RecommendedQuantity>
                  Reordenar: {item.recommendedQuantity} unid
                </RecommendedQuantity>
              </RestockAction>
            </RestockItem>
          ))}
        </RestockList>

        <InfoContainer>
          <InfoIcon className="fas fa-info-circle" />
          <InfoText>
            Las recomendaciones se calculan considerando el historial de ventas
            de los últimos {selectedPeriod} días.
          </InfoText>
        </InfoContainer>
      </TabContainer>
    );
  };

  // Pestaña de rendimiento de productos
  const renderPerformanceTab = () => {
    if (!productPerformance) {
      return (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Cargando análisis de productos...</LoadingText>
        </LoadingContainer>
      );
    }

    const { topSelling, worstSelling, profitable, unprofitable, summary } =
      productPerformance;

    // Renderizar selector de vista
    const renderPerformanceSelector = () => (
      <ViewSelector>
        <SelectorOption
          active={selectedChart === 'sales'}
          onClick={() => setSelectedChart('sales')}
        >
          <i className="fas fa-shopping-cart"></i>
          <span>Ventas</span>
        </SelectorOption>

        <SelectorOption
          active={selectedChart === 'profit'}
          onClick={() => setSelectedChart('profit')}
        >
          <i className="fas fa-money-bill-wave"></i>
          <span>Rentabilidad</span>
        </SelectorOption>
      </ViewSelector>
    );

    return (
      <TabContainer>
        {renderPerformanceSelector()}

        <SummaryCards>
          <SummaryCard>
            <SummaryTitle>Ventas Totales</SummaryTitle>
            <SummaryValue>{summary.totalQuantitySold} unid.</SummaryValue>
          </SummaryCard>

          <SummaryCard>
            <SummaryTitle>Ingresos</SummaryTitle>
            <SummaryValue>{formatCurrency(summary.totalRevenue)}</SummaryValue>
          </SummaryCard>

          <SummaryCard>
            <SummaryTitle>Beneficio</SummaryTitle>
            <SummaryValue>{formatCurrency(summary.totalProfit)}</SummaryValue>
          </SummaryCard>
        </SummaryCards>

        <PerformanceSection>
          <PerformanceTitle>
            {selectedChart === 'sales'
              ? 'Productos Más Vendidos'
              : 'Productos Más Rentables'}
          </PerformanceTitle>

          <CardRow>
            {(selectedChart === 'sales' ? topSelling : profitable).map(item => (
              <PerformanceCard key={item.id}>
                <CardTitle>{item.name}</CardTitle>
                <CardValue>
                  {selectedChart === 'sales'
                    ? `${item.quantitySold} unid.`
                    : formatCurrency(item.profit)}
                </CardValue>
                <CardSubtitle>
                  {selectedChart === 'sales'
                    ? `${item.contributionToSales.toFixed(1)}% del total`
                    : `Margen: ${item.profitMargin.toFixed(1)}%`}
                </CardSubtitle>
              </PerformanceCard>
            ))}
          </CardRow>
        </PerformanceSection>

        <PerformanceSection>
          <PerformanceTitle>
            {selectedChart === 'sales'
              ? 'Productos Menos Vendidos'
              : 'Productos Menos Rentables'}
          </PerformanceTitle>

          <CardRow>
            {(selectedChart === 'sales' ? worstSelling : unprofitable).map(
              item => (
                <PerformanceCard key={item.id} warning>
                  <CardTitle>{item.name}</CardTitle>
                  <CardValue>
                    {selectedChart === 'sales'
                      ? `${item.quantitySold} unid.`
                      : formatCurrency(item.profit)}
                  </CardValue>
                  <CardSubtitle>
                    {selectedChart === 'sales'
                      ? `Stock: ${item.currentStock} unid.`
                      : `Margen: ${item.profitMargin.toFixed(1)}%`}
                  </CardSubtitle>
                </PerformanceCard>
              )
            )}
          </CardRow>
        </PerformanceSection>
      </TabContainer>
    );
  };

  // Pestaña de patrones estacionales
  const renderSeasonalTab = () => {
    if (!seasonalPatterns) {
      return (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Analizando patrones estacionales...</LoadingText>
        </LoadingContainer>
      );
    }

    const { byDayOfWeek, recommendations } = seasonalPatterns;
    const chartData = getSeasonalChartData();

    return (
      <TabContainer>
        <ChartSection>
          <SectionTitle>Ventas por Día de la Semana</SectionTitle>

          {chartData.length > 0 ? (
            <ChartContainer>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={value => [formatCurrency(value), 'Ventas']}
                  />
                  <Legend />
                  <Bar dataKey="value" fill={colors.primary} name="Ventas" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <NoDataChart>
              <p>No hay suficientes datos para analizar patrones.</p>
            </NoDataChart>
          )}
        </ChartSection>

        <SeasonalInsights>
          <InsightTitle>Insights de Estacionalidad</InsightTitle>

          <InsightCard>
            <InsightIcon className="fas fa-calendar" />
            <InsightContent>
              <InsightLabel>Días de Mayor Venta</InsightLabel>
              <InsightValue>
                {recommendations.peakDays.length > 0
                  ? recommendations.peakDays.join(', ')
                  : 'Sin datos suficientes'}
              </InsightValue>
            </InsightContent>
          </InsightCard>

          <InsightCard>
            <InsightIcon className="fas fa-clock" />
            <InsightContent>
              <InsightLabel>Horas Pico</InsightLabel>
              <InsightValue>
                {recommendations.peakHours.length > 0
                  ? recommendations.peakHours.join(', ')
                  : 'Sin datos suficientes'}
              </InsightValue>
            </InsightContent>
          </InsightCard>

          <InsightCard>
            <InsightIcon className="fas fa-users" />
            <InsightContent>
              <InsightLabel>Recomendación de Personal</InsightLabel>
              <InsightValue>
                {recommendations.staffingRecommendation ||
                  'Sin recomendaciones disponibles'}
              </InsightValue>
            </InsightContent>
          </InsightCard>

          <InsightCard>
            <InsightIcon className="fas fa-chart-line" />
            <InsightContent>
              <InsightLabel>Temporada Alta</InsightLabel>
              <InsightValue>
                {recommendations.highSeasonMonths.length > 0
                  ? recommendations.highSeasonMonths.join(', ')
                  : 'Sin datos suficientes'}
              </InsightValue>
            </InsightContent>
          </InsightCard>
        </SeasonalInsights>
      </TabContainer>
    );
  };

  return (
    <PageContainer>
      <PageHeader>
        <HeaderTitle>Análisis Avanzado</HeaderTitle>

        <PeriodSelector>
          <PeriodOption
            active={selectedPeriod === 30}
            onClick={() => setSelectedPeriod(30)}
          >
            30 días
          </PeriodOption>

          <PeriodOption
            active={selectedPeriod === 90}
            onClick={() => setSelectedPeriod(90)}
          >
            90 días
          </PeriodOption>

          <PeriodOption
            active={selectedPeriod === 180}
            onClick={() => setSelectedPeriod(180)}
          >
            180 días
          </PeriodOption>
        </PeriodSelector>
      </PageHeader>

      <TabsContainer>
        <Tabs>
          <Tab
            active={activeTab === 'predictions'}
            onClick={() => setActiveTab('predictions')}
          >
            <i className="fas fa-chart-line"></i>
            <span>Predicciones</span>
          </Tab>

          <Tab
            active={activeTab === 'restock'}
            onClick={() => setActiveTab('restock')}
          >
            <i className="fas fa-sync"></i>
            <span>Reabastecimiento</span>
          </Tab>

          <Tab
            active={activeTab === 'performance'}
            onClick={() => setActiveTab('performance')}
          >
            <i className="fas fa-chart-bar"></i>
            <span>Rendimiento</span>
          </Tab>

          <Tab
            active={activeTab === 'seasonal'}
            onClick={() => setActiveTab('seasonal')}
          >
            <i className="fas fa-calendar"></i>
            <span>Estacionalidad</span>
          </Tab>
        </Tabs>
      </TabsContainer>

      <ContentContainer>{renderTabContent()}</ContentContainer>
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
  padding: 16px;
  background-color: white;
  border-radius: 10px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const HeaderTitle = styled.h1`
  font-size: 24px;
  font-weight: bold;
  color: ${colors.text};
  margin-bottom: 16px;
`;

const PeriodSelector = styled.div`
  display: flex;
  background-color: ${colors.background};
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
`;

const PeriodOption = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background-color: ${props => (props.active ? colors.primary : 'transparent')};
  color: ${props => (props.active ? 'white' : colors.text)};
  cursor: pointer;
  font-weight: ${props => (props.active ? '500' : 'normal')};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props =>
      props.active ? colors.primary : colors.border};
  }
`;

const TabsContainer = styled.div`
  background-color: white;
  padding: 4px 16px;
  border-radius: 10px 10px 0 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const Tabs = styled.div`
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    height: 0;
    width: 0;
  }
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin: 0 4px;
  border: none;
  background-color: ${props =>
    props.active ? `${colors.primary}10` : 'transparent'};
  color: ${props => (props.active ? colors.primary : colors.textLight)};
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  i {
    margin-right: 8px;
  }

  &:hover {
    background-color: ${props =>
      props.active ? `${colors.primary}15` : colors.background};
  }
`;

const ContentContainer = styled.div`
  background-color: white;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-height: 400px;
`;

const TabContainer = styled.div`
  padding: 24px;
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

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 0 24px;
  text-align: center;
`;

const ErrorIcon = styled.i`
  font-size: 48px;
  color: ${colors.danger};
  margin-bottom: 16px;
`;

const ErrorText = styled.p`
  font-size: 16px;
  color: ${colors.text};
  margin-bottom: 24px;
`;

const RetryButton = styled.button`
  padding: 8px 16px;
  background-color: ${colors.primary};
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${colors.primaryDark};
  }
`;

const ChartSection = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 24px;
  border: 1px solid ${colors.border};
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 16px;
`;

const ChartContainer = styled.div`
  margin-bottom: 16px;
`;

const ChartLegend = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 16px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin: 0 12px;
`;

const LegendColor = styled.div`
  width: 16px;
  height: 16px;
  background-color: ${props => props.color || colors.primary};
  border-radius: 4px;
  margin-right: 8px;
`;

const LegendText = styled.span`
  font-size: 14px;
  color: ${colors.textLight};
`;

const NoDataChart = styled.div`
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.textLight};
  font-size: 16px;
  background-color: ${colors.background};
  border-radius: 8px;
`;

const PredictionSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const SummaryCard = styled.div`
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid ${colors.border};
  text-align: center;
`;

const SummaryTitle = styled.div`
  font-size: 14px;
  color: ${colors.textLight};
  margin-bottom: 8px;
`;

const SummaryValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: ${colors.text};
  margin-bottom: 4px;
`;

const SummarySubtitle = styled.div`
  font-size: 12px;
  color: ${colors.textLight};
`;

const InfoContainer = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background-color: ${colors.primary}05;
  border-radius: 8px;
  margin-top: 16px;
`;

const InfoIcon = styled.i`
  color: ${colors.primary};
  font-size: 18px;
  margin-right: 12px;
  margin-top: 2px;
`;

const InfoText = styled.p`
  font-size: 14px;
  color: ${colors.text};
  line-height: 1.5;
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 0 24px;
  text-align: center;
`;

const EmptyIcon = styled.i`
  font-size: 48px;
  color: ${colors.success};
  margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
  font-size: 20px;
  font-weight: bold;
  color: ${colors.text};
  margin-bottom: 8px;
`;

const EmptyText = styled.p`
  font-size: 16px;
  color: ${colors.textLight};
  max-width: 500px;
`;

const SectionHeader = styled.div`
  margin-bottom: 24px;
`;

const SectionSubtitle = styled.p`
  font-size: 14px;
  color: ${colors.textLight};
  margin-top: 4px;
`;

const RestockList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const RestockItem = styled.div`
  display: flex;
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid ${colors.border};
  border-left: 4px solid
    ${props => {
      if (props.urgency === 'high') return colors.danger;
      if (props.urgency === 'medium') return colors.warning;
      return colors.info;
    }};
`;

const RestockInfo = styled.div`
  flex: 3;
`;

const RestockName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 4px;
`;

const RestockSku = styled.p`
  font-size: 14px;
  color: ${colors.textLight};
  margin-bottom: 8px;
`;

const RestockMetrics = styled.div`
  display: flex;
  margin-bottom: 4px;
`;

const MetricLabel = styled.span`
  font-size: 14px;
  color: ${colors.textLight};
  width: 100px;
`;

const MetricValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.text};
`;

const RestockAction = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-left: 1px solid ${colors.border};
  padding-left: 16px;
`;

const DaysLabel = styled.div`
  font-size: 14px;
  color: ${colors.textLight};
  text-align: center;
  margin-bottom: 8px;
`;

const RecommendedQuantity = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.primary};
  text-align: center;
`;

const ViewSelector = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const SelectorOption = styled.button`
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid ${props => (props.active ? colors.primary : colors.border)};
  background-color: ${props =>
    props.active ? `${colors.primary}10` : 'white'};
  color: ${props => (props.active ? colors.primary : colors.text)};
  cursor: pointer;
  transition: all 0.2s ease;

  i {
    margin-right: 8px;
  }

  &:hover {
    background-color: ${props =>
      props.active ? `${colors.primary}15` : colors.background};
  }
`;

const PerformanceSection = styled.div`
  margin-bottom: 24px;
`;

const PerformanceTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 16px;
`;

const CardRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const PerformanceCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid ${colors.border};
  ${props => props.warning && `border-top: 4px solid ${colors.warning};`}
`;

const CardTitle = styled.h4`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.text};
  margin-bottom: 12px;
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const CardValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 4px;
`;

const CardSubtitle = styled.div`
  font-size: 12px;
  color: ${colors.textLight};
`;

const SeasonalInsights = styled.div`
  margin-top: 24px;
`;

const InsightTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 16px;
`;

const InsightCard = styled.div`
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid ${colors.border};
`;

const InsightIcon = styled.i`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${colors.primary}10;
  color: ${colors.primary};
  border-radius: 20px;
  margin-right: 16px;
  font-size: 18px;
`;

const InsightContent = styled.div`
  flex: 1;
`;

const InsightLabel = styled.div`
  font-size: 14px;
  color: ${colors.textLight};
  margin-bottom: 4px;
`;

const InsightValue = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${colors.text};
`;

export default AnalyticsPage;
