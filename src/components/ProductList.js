// src/components/ProductList.js

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { colors } from '../utils/constants';
import Card from './Card';

/**
 * Componente para mostrar listado de productos con opciones de filtrado y ordenamiento
 *
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.products - Lista de productos a mostrar
 * @param {boolean} props.loading - Si se están cargando los productos
 * @param {function} props.onRefresh - Función para recargar los productos
 * @param {function} props.onSelect - Función para manejar selección de un producto
 * @param {boolean} props.showCategories - Si mostrar el filtro de categorías
 */
const ProductList = ({
  products = [],
  loading = false,
  onRefresh,
  onSelect,
  showCategories = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc',
  });
  const [isTableView, setIsTableView] = useState(window.innerWidth >= 768);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Extraer categorías únicas de los productos
  const categories = [
    'Todos',
    ...new Set(products.map(p => p.category).filter(Boolean)),
  ];

  // Filtrar y ordenar productos
  useEffect(() => {
    let result = [...products];

    // Filtrar por categoría si no es "Todos"
    if (selectedCategory !== 'Todos') {
      result = result.filter(product => product.category === selectedCategory);
    }

    // Filtrar por término de búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        product =>
          (product.name && product.name.toLowerCase().includes(query)) ||
          (product.sku && product.sku.toLowerCase().includes(query)) ||
          (product.description &&
            product.description.toLowerCase().includes(query))
      );
    }

    // Ordenar productos
    if (sortConfig.key) {
      result.sort((a, b) => {
        // Manejar valores nulos o indefinidos
        if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;

        // Ordenar según el tipo de dato
        if (typeof a[sortConfig.key] === 'string') {
          return sortConfig.direction === 'asc'
            ? a[sortConfig.key].localeCompare(b[sortConfig.key])
            : b[sortConfig.key].localeCompare(a[sortConfig.key]);
        } else {
          return sortConfig.direction === 'asc'
            ? a[sortConfig.key] - b[sortConfig.key]
            : b[sortConfig.key] - a[sortConfig.key];
        }
      });
    }

    setFilteredProducts(result);
  }, [products, searchQuery, selectedCategory, sortConfig]);

  // Formatear moneda
  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Cambiar ordenamiento
  const handleSort = key => {
    setSortConfig(prevSortConfig => ({
      key,
      direction:
        prevSortConfig.key === key
          ? prevSortConfig.direction === 'asc'
            ? 'desc'
            : 'asc'
          : 'asc',
    }));
  };

  // Aplicar un efecto de ventana para adaptar la vista según dimensiones
  useEffect(() => {
    const handleResize = () => {
      setIsTableView(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Container>
      <Header>
        <SearchContainer focused={isSearchFocused}>
          <SearchIcon className="fas fa-search" />
          <SearchInput
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery && (
            <ClearButton onClick={() => setSearchQuery('')}>
              <i className="fas fa-times" />
            </ClearButton>
          )}
        </SearchContainer>

        <ViewSelector>
          <ViewButton
            active={!isTableView}
            onClick={() => setIsTableView(false)}
            title="Vista de tarjetas"
          >
            <i className="fas fa-th-large" />
          </ViewButton>
          <ViewButton
            active={isTableView}
            onClick={() => setIsTableView(true)}
            title="Vista de tabla"
          >
            <i className="fas fa-list" />
          </ViewButton>
        </ViewSelector>
      </Header>

      {showCategories && (
        <CategoriesContainer>
          <CategoriesList>
            {categories.map((category, index) => (
              <CategoryChip
                key={`category-${index}`}
                selected={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </CategoryChip>
            ))}
          </CategoriesList>
        </CategoriesContainer>
      )}

      {loading ? (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Cargando productos...</LoadingText>
        </LoadingContainer>
      ) : (
        <>
          {isTableView ? (
            <TableContainer>
              <TableHeader>
                <TableHeaderCell flex={3} onClick={() => handleSort('name')}>
                  Producto
                  <SortIcon
                    className={
                      sortConfig.key === 'name'
                        ? sortConfig.direction === 'asc'
                          ? 'fas fa-chevron-up'
                          : 'fas fa-chevron-down'
                        : 'fas fa-sort'
                    }
                  />
                </TableHeaderCell>
                <TableHeaderCell flex={2} onClick={() => handleSort('price')}>
                  Precio
                  <SortIcon
                    className={
                      sortConfig.key === 'price'
                        ? sortConfig.direction === 'asc'
                          ? 'fas fa-chevron-up'
                          : 'fas fa-chevron-down'
                        : 'fas fa-sort'
                    }
                  />
                </TableHeaderCell>
                <TableHeaderCell
                  flex={2}
                  onClick={() => handleSort('quantity')}
                >
                  Stock
                  <SortIcon
                    className={
                      sortConfig.key === 'quantity'
                        ? sortConfig.direction === 'asc'
                          ? 'fas fa-chevron-up'
                          : 'fas fa-chevron-down'
                        : 'fas fa-sort'
                    }
                  />
                </TableHeaderCell>
                <TableHeaderCell flex={1}>Acciones</TableHeaderCell>
              </TableHeader>

              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <TableRow key={product.id}>
                      <TableCell flex={3}>
                        <ProductInfo>
                          <ProductName>{product.name}</ProductName>
                          <ProductSku>{product.sku || 'Sin SKU'}</ProductSku>
                        </ProductInfo>
                      </TableCell>
                      <TableCell flex={2}>
                        <ProductPrice>
                          {formatCurrency(product.price || 0)}
                        </ProductPrice>
                      </TableCell>
                      <TableCell flex={2}>
                        <StockBadge
                          status={
                            product.quantity <= 0
                              ? 'out'
                              : product.quantity <= 5
                              ? 'low'
                              : 'in'
                          }
                        >
                          {product.quantity <= 0
                            ? 'Agotado'
                            : `${product.quantity} uds.`}
                        </StockBadge>
                      </TableCell>
                      <TableCell flex={1}>
                        <ActionButton
                          as={onSelect ? 'button' : Link}
                          onClick={
                            onSelect ? () => onSelect(product) : undefined
                          }
                          to={onSelect ? undefined : `/products/${product.id}`}
                        >
                          <i className="fas fa-eye" />
                        </ActionButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyState>
                    <EmptyIcon className="fas fa-box-open" />
                    <EmptyTitle>No hay productos</EmptyTitle>
                    <EmptyText>
                      {searchQuery
                        ? `No se encontraron productos que coincidan con "${searchQuery}"`
                        : selectedCategory !== 'Todos'
                        ? `No hay productos en la categoría "${selectedCategory}"`
                        : 'No hay productos disponibles'}
                    </EmptyText>
                  </EmptyState>
                )}
              </TableBody>
            </TableContainer>
          ) : (
            <CardsContainer>
              {filteredProducts.length > 0 ? (
                <CardGrid>
                  {filteredProducts.map(product => (
                    <Card
                      key={product.id}
                      pressable
                      onClick={onSelect ? () => onSelect(product) : undefined}
                    >
                      <CardContent>
                        <CardHeader>
                          <ProductCardName>{product.name}</ProductCardName>
                          <StockIndicator
                            status={
                              product.quantity <= 0
                                ? 'out'
                                : product.quantity <= 5
                                ? 'low'
                                : 'in'
                            }
                          />
                        </CardHeader>

                        <CardDetails>
                          <DetailRow>
                            <DetailLabel>SKU:</DetailLabel>
                            <DetailValue>{product.sku || 'N/A'}</DetailValue>
                          </DetailRow>
                          <DetailRow>
                            <DetailLabel>Precio:</DetailLabel>
                            <DetailValue>
                              {formatCurrency(product.price || 0)}
                            </DetailValue>
                          </DetailRow>
                          <DetailRow>
                            <DetailLabel>Stock:</DetailLabel>
                            <DetailValue>
                              {product.quantity || 0} uds.
                            </DetailValue>
                          </DetailRow>
                          {product.category && (
                            <CategoryTag>{product.category}</CategoryTag>
                          )}
                        </CardDetails>

                        <CardActions>
                          <ViewLink
                            as={onSelect ? 'button' : Link}
                            onClick={
                              onSelect ? () => onSelect(product) : undefined
                            }
                            to={
                              onSelect ? undefined : `/products/${product.id}`
                            }
                          >
                            <i className="fas fa-eye" />
                          </ViewLink>
                        </CardActions>
                      </CardContent>
                    </Card>
                  ))}
                </CardGrid>
              ) : (
                <EmptyState>
                  <EmptyIcon className="fas fa-box-open" />
                  <EmptyTitle>No hay productos</EmptyTitle>
                  <EmptyText>
                    {searchQuery
                      ? `No se encontraron productos que coincidan con "${searchQuery}"`
                      : selectedCategory !== 'Todos'
                      ? `No hay productos en la categoría "${selectedCategory}"`
                      : 'No hay productos disponibles'}
                  </EmptyText>
                </EmptyState>
              )}
            </CardsContainer>
          )}
        </>
      )}
    </Container>
  );
};

// Estilos con styled-components
const Container = styled.div`
  width: 100%;
  background-color: ${colors.background};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: ${colors.white};
  border-bottom: 1px solid ${colors.border};
`;

const SearchContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  background-color: ${colors.background};
  border-radius: 8px;
  padding: 0 12px;
  height: 42px;
  border: 1px solid ${props => (props.focused ? colors.primary : colors.border)};
  transition: all 0.2s ease;
  box-shadow: ${props =>
    props.focused ? '0 0 0 3px rgba(108, 99, 255, 0.1)' : 'none'};
`;

const SearchIcon = styled.i`
  color: ${colors.textLight};
`;

const SearchInput = styled.input`
  flex: 1;
  margin-left: 8px;
  font-size: 15px;
  color: ${colors.text};
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: ${colors.textMuted};
  }
`;

const ClearButton = styled.button`
  background: transparent;
  border: none;
  color: ${colors.textLight};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;

  &:hover {
    color: ${colors.text};
  }
`;

const ViewSelector = styled.div`
  display: flex;
  margin-left: 12px;
`;

const ViewButton = styled.button`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: ${props =>
    props.active ? `${colors.primary}20` : 'transparent'};
  color: ${props => (props.active ? colors.primary : colors.textLight)};
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props =>
      props.active ? `${colors.primary}30` : colors.background};
  }
`;

const CategoriesContainer = styled.div`
  padding-top: 4px;
  background-color: ${colors.white};
  border-bottom: 1px solid ${colors.border};
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const CategoriesList = styled.div`
  display: flex;
  padding: 8px 16px 16px;
`;

const CategoryChip = styled.button`
  padding: 6px 16px;
  background-color: ${props =>
    props.selected ? colors.primary : colors.background};
  color: ${props => (props.selected ? colors.white : colors.text)};
  border-radius: 20px;
  margin-right: 8px;
  border: 1px solid
    ${props => (props.selected ? colors.primary : colors.border)};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  white-space: nowrap;

  &:hover {
    background-color: ${props =>
      props.selected ? colors.primary : `${colors.primary}10`};
    border-color: ${props =>
      props.selected ? colors.primary : colors.primary};
    color: ${props => (props.selected ? colors.white : colors.primary)};
  }
`;

// Estilos para la vista de tabla
const TableContainer = styled.div`
  background-color: ${colors.white};
  border-radius: 8px;
  overflow: hidden;
  margin: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const TableHeader = styled.div`
  display: flex;
  background-color: ${colors.white};
  padding: 16px;
  border-bottom: 1px solid ${colors.border};
  position: sticky;
  top: 0;
  z-index: 1;
`;

const TableHeaderCell = styled.div`
  flex: ${props => props.flex || 1};
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 15px;
  color: ${colors.text};
  cursor: pointer;
  padding-right: 16px;
  user-select: none;

  &:hover {
    color: ${colors.primary};
  }
`;

const SortIcon = styled.i`
  margin-left: 4px;
  font-size: 14px;
`;

const TableBody = styled.div`
  overflow-y: auto;
  max-height: calc(100vh - 200px);
`;

const TableRow = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid ${colors.border};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${colors.background};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.div`
  flex: ${props => props.flex || 1};
  padding-right: 16px;
`;

const ProductInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProductName = styled.div`
  font-weight: 500;
  font-size: 15px;
  color: ${colors.text};
  margin-bottom: 4px;
`;

const ProductSku = styled.div`
  font-size: 13px;
  color: ${colors.textLight};
`;

const ProductPrice = styled.div`
  font-weight: 500;
  font-size: 15px;
  color: ${colors.text};
`;

const StockBadge = styled.div`
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;

  ${props => {
    if (props.status === 'out') {
      return `
        background-color: ${colors.danger}15;
        color: ${colors.danger};
      `;
    } else if (props.status === 'low') {
      return `
        background-color: ${colors.warning}15;
        color: ${colors.warning};
      `;
    } else {
      return `
        background-color: ${colors.success}15;
        color: ${colors.success};
      `;
    }
  }}
`;

const ActionButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${colors.primary};
  color: ${colors.white};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-decoration: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

// Estilos para la vista de tarjetas
const CardsContainer = styled.div`
  padding: 16px;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }

  @media (min-width: 1200px) {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
`;

const CardContent = styled.div`
  padding: 16px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ProductCardName = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: ${colors.text};
  flex: 1;
`;

const StockIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-left: 8px;

  ${props => {
    if (props.status === 'out') {
      return `background-color: ${colors.danger};`;
    } else if (props.status === 'low') {
      return `background-color: ${colors.warning};`;
    } else {
      return `background-color: ${colors.success};`;
    }
  }}
`;

const CardDetails = styled.div`
  margin-bottom: 16px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const DetailLabel = styled.div`
  font-size: 14px;
  color: ${colors.textLight};
`;

const DetailValue = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.text};
`;

const CategoryTag = styled.div`
  display: inline-flex;
  align-self: flex-start;
  background-color: ${colors.primary}15;
  color: ${colors.primary};
  font-size: 13px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 8px;
`;

const CardActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ViewLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${colors.primary};
  color: ${colors.white};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  border: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

// Estados de carga y vacío
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background-color: ${colors.white};
  border-radius: 8px;
  margin: 16px;
  min-height: 200px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${colors.primary}20;
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

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  min-height: 200px;
`;

const EmptyIcon = styled.i`
  font-size: 48px;
  color: ${colors.textMuted};
  margin-bottom: 16px;
`;

const EmptyTitle = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: ${colors.text};
  margin-bottom: 8px;
`;

const EmptyText = styled.div`
  font-size: 16px;
  color: ${colors.textLight};
  text-align: center;
  max-width: 80%;
`;

export default ProductList;
