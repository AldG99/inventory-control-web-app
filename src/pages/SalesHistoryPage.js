import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { InventoryContext } from '../context/InventoryContext';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseService';
import COLLECTIONS from '../constants/collections';
import { colors } from '../utils/constants';

const SalesHistoryPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'

  // Cargar historial de ventas
  const loadSales = async () => {
    try {
      setLoading(true);
      // Consultar todas las ventas ordenadas por fecha (más recientes primero)
      const salesQuery = query(
        collection(db, COLLECTIONS.SALES),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(salesQuery);
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(), // Convertir timestamp a Date
      }));

      setSales(salesData);
    } catch (error) {
      console.error('Error al cargar historial de ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar ventas al montar el componente
  useEffect(() => {
    loadSales();
  }, []);

  // Filtrar ventas según el filtro de fecha
  const filteredSales = sales.filter(sale => {
    if (dateFilter === 'all') return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const saleDate = sale.createdAt;
    if (!saleDate) return false;

    if (dateFilter === 'today') {
      const saleDay = new Date(saleDate);
      saleDay.setHours(0, 0, 0, 0);
      return saleDay.getTime() === today.getTime();
    }

    if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return saleDate >= weekAgo;
    }

    if (dateFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      return saleDate >= monthAgo;
    }

    return true;
  });

  // Calcular totales
  const totalSales = filteredSales.length;
  const totalAmount = filteredSales.reduce(
    (sum, sale) => sum + (sale.total || 0),
    0
  );

  // Función para refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    await loadSales();
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

  // Ver detalle de una venta
  const viewSaleDetails = sale => {
    setSelectedSale(sale);
    setShowSaleModal(true);
  };

  return (
    <PageContainer>
      <Header>
        <HeaderTitle>Historial de Ventas</HeaderTitle>
      </Header>

      {/* Filtros de fecha */}
      <FilterContainer>
        <FilterOption
          active={dateFilter === 'all'}
          onClick={() => setDateFilter('all')}
        >
          Todas
        </FilterOption>

        <FilterOption
          active={dateFilter === 'today'}
          onClick={() => setDateFilter('today')}
        >
          Hoy
        </FilterOption>

        <FilterOption
          active={dateFilter === 'week'}
          onClick={() => setDateFilter('week')}
        >
          Esta semana
        </FilterOption>

        <FilterOption
          active={dateFilter === 'month'}
          onClick={() => setDateFilter('month')}
        >
          Este mes
        </FilterOption>
      </FilterContainer>

      {/* Resumen de ventas filtradas */}
      <Summary>
        <SummaryItem>
          <SummaryLabel>Ventas:</SummaryLabel>
          <SummaryValue>{totalSales}</SummaryValue>
        </SummaryItem>
        <SummaryItem>
          <SummaryLabel>Total:</SummaryLabel>
          <SummaryValue>{formatCurrency(totalAmount)}</SummaryValue>
        </SummaryItem>
      </Summary>

      {loading && !refreshing ? (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Cargando ventas...</LoadingText>
        </LoadingContainer>
      ) : filteredSales.length > 0 ? (
        <SalesList>
          {filteredSales.map(sale => (
            <SaleItem key={sale.id} onClick={() => viewSaleDetails(sale)}>
              <SaleHeader>
                <SaleHeaderInfo>
                  <SaleId>Venta #{sale.id.slice(-6)}</SaleId>
                  <SaleDate>
                    {sale.createdAt
                      ? formatDate(sale.createdAt)
                      : 'Fecha no disponible'}
                  </SaleDate>
                </SaleHeaderInfo>
                <SaleTotal>{formatCurrency(sale.total || 0)}</SaleTotal>
              </SaleHeader>

              <SaleInfo>
                <SaleInfoItem>
                  <i
                    className="fas fa-shopping-cart"
                    style={{ color: colors.textLight }}
                  ></i>
                  <SaleInfoText>
                    {sale.items?.length || 0} productos
                  </SaleInfoText>
                </SaleInfoItem>

                <SaleInfoItem>
                  <i
                    className={
                      sale.paymentMethod === 'Efectivo'
                        ? 'fas fa-money-bill'
                        : sale.paymentMethod === 'Tarjeta'
                        ? 'fas fa-credit-card'
                        : 'fas fa-exchange-alt'
                    }
                    style={{ color: colors.textLight }}
                  ></i>
                  <SaleInfoText>
                    {sale.paymentMethod || 'Efectivo'}
                  </SaleInfoText>
                </SaleInfoItem>
              </SaleInfo>
            </SaleItem>
          ))}
        </SalesList>
      ) : (
        <EmptyState>
          <i
            className="fas fa-receipt"
            style={{ fontSize: '48px', color: colors.textMuted }}
          ></i>
          <EmptyStateTitle>No hay ventas registradas</EmptyStateTitle>
          <EmptyStateText>
            {dateFilter !== 'all'
              ? 'No hay ventas en el período seleccionado'
              : 'Las ventas que registres aparecerán aquí'}
          </EmptyStateText>
        </EmptyState>
      )}

      {/* Modal de detalle de venta */}
      {showSaleModal && selectedSale && (
        <ModalOverlay>
          <ModalContainer>
            <ModalHeader>
              <ModalTitle>Detalle de Venta</ModalTitle>
              <CloseButton onClick={() => setShowSaleModal(false)}>
                <i className="fas fa-times" style={{ fontSize: '20px' }}></i>
              </CloseButton>
            </ModalHeader>

            <ModalContent>
              {/* Información general */}
              <DetailSection>
                <DetailRow>
                  <DetailLabel>Venta #</DetailLabel>
                  <DetailValue>{selectedSale.id.slice(-6)}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>Fecha</DetailLabel>
                  <DetailValue>
                    {selectedSale.createdAt
                      ? formatDate(selectedSale.createdAt)
                      : 'Fecha no disponible'}
                  </DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>Método de pago</DetailLabel>
                  <DetailValue>
                    {selectedSale.paymentMethod || 'Efectivo'}
                  </DetailValue>
                </DetailRow>
                {selectedSale.notes && (
                  <NotesContainer>
                    <DetailLabel>Notas</DetailLabel>
                    <NotesText>{selectedSale.notes}</NotesText>
                  </NotesContainer>
                )}
              </DetailSection>

              {/* Productos */}
              <ProductSection>
                <SectionTitle>Productos</SectionTitle>
                {selectedSale.items &&
                  selectedSale.items.map((item, index) => (
                    <ProductItem key={index}>
                      <ProductInfo>
                        <ProductName>{item.productName}</ProductName>
                        <ProductPriceQuantity>
                          <ProductQuantity>{item.quantity} x </ProductQuantity>
                          <ProductPrice>
                            {formatCurrency(item.price)}
                          </ProductPrice>
                        </ProductPriceQuantity>
                      </ProductInfo>
                      <ProductTotal>
                        {formatCurrency(
                          item.subtotal || item.price * item.quantity
                        )}
                      </ProductTotal>
                    </ProductItem>
                  ))}
              </ProductSection>

              {/* Totales */}
              <TotalSection>
                <TotalRow>
                  <TotalLabel>Subtotal</TotalLabel>
                  <TotalValue>
                    {formatCurrency(selectedSale.total || 0)}
                  </TotalValue>
                </TotalRow>
                <TotalRow>
                  <TotalLabel>Impuestos</TotalLabel>
                  <TotalValue>{formatCurrency(0)}</TotalValue>
                </TotalRow>
                <GrandTotal>
                  <GrandTotalLabel>TOTAL</GrandTotalLabel>
                  <GrandTotalValue>
                    {formatCurrency(selectedSale.total || 0)}
                  </GrandTotalValue>
                </GrandTotal>
              </TotalSection>
            </ModalContent>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* Botón de Actualizar */}
      <RefreshButton onClick={onRefresh} disabled={refreshing}>
        {refreshing ? <RefreshSpinner /> : <i className="fas fa-sync-alt"></i>}
      </RefreshButton>
    </PageContainer>
  );
};

// Estilos
const PageContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: ${colors.background};
  min-height: 100vh;
`;

const Header = styled.header`
  padding: 16px;
  background-color: ${colors.white};
  border-bottom: 1px solid ${colors.border};
`;

const HeaderTitle = styled.h1`
  font-size: 20px;
  font-weight: bold;
  color: ${colors.text};
`;

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  background-color: ${colors.white};
  padding: 0 16px 16px 16px;
  border-bottom: 1px solid ${colors.border};

  @media (max-width: 600px) {
    justify-content: center;
  }
`;

const FilterOption = styled.button`
  padding: 8px 12px;
  margin-right: 8px;
  margin-bottom: 8px;
  border-radius: 8px;
  border: 1px solid ${props => (props.active ? colors.primary : colors.border)};
  background-color: ${props => (props.active ? colors.primary : 'transparent')};
  color: ${props => (props.active ? colors.white : colors.text)};
  font-size: 14px;
  font-weight: ${props => (props.active ? 500 : 'normal')};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props =>
      props.active ? colors.primary : colors.background};
  }
`;

const Summary = styled.div`
  display: flex;
  flex-wrap: wrap;
  background-color: ${colors.white};
  padding: 16px;
  border-bottom: 1px solid ${colors.border};

  @media (max-width: 600px) {
    justify-content: space-around;
  }
`;

const SummaryItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: 24px;
  margin-bottom: 8px;
`;

const SummaryLabel = styled.span`
  font-size: 15px;
  color: ${colors.textLight};
  margin-right: 8px;
`;

const SummaryValue = styled.span`
  font-size: 16px;
  font-weight: bold;
  color: ${colors.text};
`;

const SalesList = styled.div`
  padding: 16px;
  flex: 1;
  overflow-y: auto;
`;

const SaleItem = styled.div`
  background-color: ${colors.white};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const SaleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const SaleHeaderInfo = styled.div``;

const SaleId = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: ${colors.text};
`;

const SaleDate = styled.div`
  font-size: 14px;
  color: ${colors.textLight};
  margin-bottom: 4px;
`;

const SaleTotal = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: ${colors.success};
`;

const SaleInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const SaleInfoItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: 16px;
  margin-bottom: 4px;
`;

const SaleInfoText = styled.span`
  font-size: 14px;
  color: ${colors.textLight};
  margin-left: 6px;
`;

const LoadingContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
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

const LoadingText = styled.p`
  font-size: 16px;
  color: ${colors.textLight};
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 16px;
  text-align: center;
`;

const EmptyStateTitle = styled.h2`
  font-size: 20px;
  font-weight: bold;
  color: ${colors.text};
  margin: 16px 0 8px;
`;

const EmptyStateText = styled.p`
  font-size: 16px;
  color: ${colors.textLight};
  max-width: 300px;
  text-align: center;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: ${colors.white};
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  @media (min-width: 768px) {
    width: 80%;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid ${colors.border};
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: bold;
  color: ${colors.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
`;

const ModalContent = styled.div`
  padding: 16px;
  overflow-y: auto;
  max-height: calc(90vh - 60px);
`;

const DetailSection = styled.div`
  margin-bottom: 24px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid ${colors.border};
`;

const DetailLabel = styled.span`
  font-size: 14px;
  color: ${colors.textLight};
`;

const DetailValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.text};
`;

const NotesContainer = styled.div`
  margin-top: 12px;
  padding: 12px;
  background-color: ${colors.background};
  border-radius: 6px;
`;

const NotesText = styled.p`
  margin-top: 4px;
  font-size: 14px;
  color: ${colors.text};
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  color: ${colors.text};
  margin-bottom: 12px;
`;

const ProductSection = styled.div`
  margin-bottom: 24px;
`;

const ProductItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid ${colors.border};
`;

const ProductInfo = styled.div`
  flex: 1;
`;

const ProductName = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${colors.text};
  margin-bottom: 4px;
`;

const ProductPriceQuantity = styled.div`
  display: flex;
  align-items: center;
`;

const ProductQuantity = styled.span`
  font-size: 14px;
  color: ${colors.textLight};
`;

const ProductPrice = styled.span`
  font-size: 14px;
  color: ${colors.textLight};
`;

const ProductTotal = styled.div`
  font-size: 15px;
  font-weight: bold;
  color: ${colors.primary};
`;

const TotalSection = styled.div`
  background-color: ${colors.background};
  border-radius: 8px;
  padding: 12px;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
`;

const TotalLabel = styled.span`
  font-size: 14px;
  color: ${colors.textLight};
`;

const TotalValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.text};
`;

const GrandTotal = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  border-top: 1px solid ${colors.border};
  padding-top: 12px;
`;

const GrandTotalLabel = styled.span`
  font-size: 16px;
  font-weight: bold;
  color: ${colors.text};
`;

const GrandTotalValue = styled.span`
  font-size: 18px;
  font-weight: bold;
  color: ${colors.primary};
`;

const RefreshButton = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: ${colors.primary};
  color: white;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 12px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    background-color: ${colors.textMuted};
    cursor: not-allowed;
  }
`;

const RefreshSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
`;

export default SalesHistoryPage;
