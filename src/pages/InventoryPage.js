import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { InventoryContext } from '../context/InventoryContext';
import { colors } from '../utils/constants';
import ProductList from '../components/ProductList';

const InventoryPage = () => {
  const { products, loading } = useContext(InventoryContext);
  const [refreshing, setRefreshing] = useState(false);

  // Función para refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    // Los productos se recargan automáticamente por el context
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <PageContainer>
      <PageHeader>
        <HeaderTitle>Inventario</HeaderTitle>
        <AddButton to="/add-product">
          <i className="fas fa-plus"></i>
          <span>Añadir Producto</span>
        </AddButton>
      </PageHeader>

      <ProductListContainer>
        <ProductList
          products={products}
          loading={loading}
          onRefresh={onRefresh}
          showCategories={true}
        />
      </ProductListContainer>
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

const HeaderTitle = styled.h1`
  font-size: 24px;
  font-weight: bold;
  color: ${colors.text};
`;

const AddButton = styled(Link)`
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

const ProductListContainer = styled.div`
  background-color: ${colors.white};
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

export default InventoryPage;
