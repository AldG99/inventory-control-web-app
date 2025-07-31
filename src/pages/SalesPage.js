import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { InventoryContext } from '../context/InventoryContext';
import { colors } from '../utils/constants';
import Button from '../components/Button';
import Card from '../components/Card';

const SalesPage = () => {
  const { products, registerSale } = useContext(InventoryContext);
  const navigate = useNavigate();

  // Estados para la venta
  const [cartItems, setCartItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Calcular el total de la venta
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Filtrar productos según búsqueda
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        product =>
          (product.name?.toLowerCase().includes(query) ||
            product.sku?.toLowerCase().includes(query)) &&
          product.quantity > 0 // Solo mostrar productos con stock
      );
      setFilteredProducts(filtered);
    } else {
      // Si no hay búsqueda, mostrar todos los productos con stock
      setFilteredProducts(products.filter(product => product.quantity > 0));
    }
  }, [products, searchQuery]);

  // Formatear moneda
  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Añadir producto al carrito
  const addToCart = product => {
    // Verificar si el producto ya está en el carrito
    const existingItemIndex = cartItems.findIndex(
      item => item.productId === product.id
    );

    if (existingItemIndex >= 0) {
      // Si ya existe, incrementar la cantidad
      const updatedItems = [...cartItems];
      const currentQuantity = updatedItems[existingItemIndex].quantity;

      // Verificar si hay suficiente stock
      if (currentQuantity >= product.quantity) {
        alert(`Solo hay ${product.quantity} unidades disponibles.`);
        return;
      }

      updatedItems[existingItemIndex].quantity += 1;
      setCartItems(updatedItems);
    } else {
      // Si no existe, añadirlo al carrito
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          maxQuantity: product.quantity, // Guardar la cantidad máxima disponible
        },
      ]);
    }

    // Cerrar el modal después de añadir
    setShowProductModal(false);
    setSearchQuery('');
  };

  // Eliminar producto del carrito
  const removeFromCart = index => {
    const updatedItems = [...cartItems];
    updatedItems.splice(index, 1);
    setCartItems(updatedItems);
  };

  // Cambiar cantidad de un producto en el carrito
  const updateItemQuantity = (index, newQuantity) => {
    const updatedItems = [...cartItems];
    const maxQuantity = updatedItems[index].maxQuantity;

    // Validar que la cantidad no exceda el stock disponible
    if (newQuantity > maxQuantity) {
      alert(`Solo hay ${maxQuantity} unidades disponibles.`);
      return;
    }

    if (newQuantity <= 0) {
      // Si la cantidad es 0 o menos, eliminar el producto
      removeFromCart(index);
    } else {
      updatedItems[index].quantity = newQuantity;
      setCartItems(updatedItems);
    }
  };

  // Registrar la venta
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('Añade productos al carrito para realizar una venta.');
      return;
    }

    try {
      setLoading(true);

      // Preparar los datos de la venta
      const saleData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
        total: total,
        paymentMethod: paymentMethod,
        notes: notes.trim() || null,
        createdAt: new Date(),
      };

      // Registrar la venta en Firestore
      await registerSale(saleData);

      // Mostrar mensaje de éxito
      alert('Venta registrada correctamente');

      // Limpiar carrito y otros campos
      setCartItems([]);
      setNotes('');
      setPaymentMethod('Efectivo');

      // Navegar al historial de ventas
      navigate('/sales-history');
    } catch (error) {
      console.error('Error al registrar venta:', error);
      alert('No se pudo registrar la venta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <HeaderTitle>Nueva Venta</HeaderTitle>
        <AddProductButton onClick={() => setShowProductModal(true)}>
          <i className="fas fa-plus"></i>
          <span>Añadir Producto</span>
        </AddProductButton>
      </PageHeader>

      <ContentGrid>
        <CartSection>
          <SectionCard>
            <SectionHeader>
              <SectionTitle>Productos Seleccionados</SectionTitle>
            </SectionHeader>

            {cartItems.length > 0 ? (
              <CartItemsList>
                {cartItems.map((item, index) => (
                  <CartItem key={`${item.productId}-${index}`}>
                    <CartItemHeader>
                      <CartItemName>{item.productName}</CartItemName>
                      <RemoveButton onClick={() => removeFromCart(index)}>
                        <i className="fas fa-times"></i>
                      </RemoveButton>
                    </CartItemHeader>

                    <CartItemBody>
                      <QuantityControls>
                        <QuantityButton
                          onClick={() =>
                            updateItemQuantity(index, item.quantity - 1)
                          }
                        >
                          <i className="fas fa-minus"></i>
                        </QuantityButton>
                        <QuantityValue>{item.quantity}</QuantityValue>
                        <QuantityButton
                          onClick={() =>
                            updateItemQuantity(index, item.quantity + 1)
                          }
                        >
                          <i className="fas fa-plus"></i>
                        </QuantityButton>
                      </QuantityControls>

                      <PriceContainer>
                        <UnitPrice>{formatCurrency(item.price)}</UnitPrice>
                        <SubtotalPrice>
                          {formatCurrency(item.price * item.quantity)}
                        </SubtotalPrice>
                      </PriceContainer>
                    </CartItemBody>
                  </CartItem>
                ))}
              </CartItemsList>
            ) : (
              <EmptyCart>
                <i className="fas fa-shopping-cart"></i>
                <EmptyCartTitle>Carrito Vacío</EmptyCartTitle>
                <EmptyCartText>
                  Añade productos para registrar una venta
                </EmptyCartText>
                <Button
                  title="Añadir Productos"
                  variant="primary"
                  onClick={() => setShowProductModal(true)}
                />
              </EmptyCart>
            )}
          </SectionCard>
        </CartSection>

        <DetailSection>
          {cartItems.length > 0 && (
            <>
              <SectionCard>
                <SectionHeader>
                  <SectionTitle>Método de Pago</SectionTitle>
                </SectionHeader>

                <PaymentMethods>
                  <PaymentMethod
                    selected={paymentMethod === 'Efectivo'}
                    onClick={() => setPaymentMethod('Efectivo')}
                  >
                    <i className="fas fa-money-bill-wave"></i>
                    <span>Efectivo</span>
                  </PaymentMethod>

                  <PaymentMethod
                    selected={paymentMethod === 'Tarjeta'}
                    onClick={() => setPaymentMethod('Tarjeta')}
                  >
                    <i className="fas fa-credit-card"></i>
                    <span>Tarjeta</span>
                  </PaymentMethod>

                  <PaymentMethod
                    selected={paymentMethod === 'Transferencia'}
                    onClick={() => setPaymentMethod('Transferencia')}
                  >
                    <i className="fas fa-exchange-alt"></i>
                    <span>Transferencia</span>
                  </PaymentMethod>
                </PaymentMethods>
              </SectionCard>

              <SectionCard>
                <SectionHeader>
                  <SectionTitle>Notas (Opcional)</SectionTitle>
                </SectionHeader>
                <NotesInput
                  placeholder="Añadir notas sobre la venta..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                />
              </SectionCard>

              <SectionCard>
                <SectionHeader>
                  <SectionTitle>Resumen</SectionTitle>
                </SectionHeader>

                <SummaryRow>
                  <SummaryLabel>Subtotal</SummaryLabel>
                  <SummaryValue>{formatCurrency(total)}</SummaryValue>
                </SummaryRow>

                <SummaryRow>
                  <SummaryLabel>Impuestos</SummaryLabel>
                  <SummaryValue>{formatCurrency(0)}</SummaryValue>
                </SummaryRow>

                <TotalRow>
                  <TotalLabel>TOTAL</TotalLabel>
                  <TotalValue>{formatCurrency(total)}</TotalValue>
                </TotalRow>

                <CheckoutButton onClick={handleCheckout} disabled={loading}>
                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i>
                      <span>Finalizar Venta</span>
                    </>
                  )}
                </CheckoutButton>
              </SectionCard>
            </>
          )}
        </DetailSection>
      </ContentGrid>

      {/* Modal para buscar y añadir productos */}
      {showProductModal && (
        <Modal>
          <ModalOverlay onClick={() => setShowProductModal(false)} />
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Añadir Productos</ModalTitle>
              <CloseButton onClick={() => setShowProductModal(false)}>
                <i className="fas fa-times"></i>
              </CloseButton>
            </ModalHeader>

            <SearchContainer>
              <SearchInput
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
              <SearchIcon className="fas fa-search" />
            </SearchContainer>

            <ProductsList>
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <ProductItem
                    key={product.id}
                    onClick={() => addToCart(product)}
                  >
                    <ProductInfo>
                      <ProductName>{product.name}</ProductName>
                      {product.sku && (
                        <ProductSku>SKU: {product.sku}</ProductSku>
                      )}
                      <ProductDetails>
                        <ProductPrice>
                          {formatCurrency(product.price || 0)}
                        </ProductPrice>
                        <ProductStock>
                          Stock: {product.quantity} unidades
                        </ProductStock>
                      </ProductDetails>
                    </ProductInfo>
                    <AddToCartButton
                      onClick={e => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                    >
                      <i className="fas fa-plus"></i>
                    </AddToCartButton>
                  </ProductItem>
                ))
              ) : (
                <EmptyResults>
                  <EmptyResultsText>
                    {searchQuery
                      ? `No se encontraron productos que coincidan con "${searchQuery}"`
                      : 'No hay productos disponibles'}
                  </EmptyResultsText>
                </EmptyResults>
              )}
            </ProductsList>
          </ModalContent>
        </Modal>
      )}
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

const AddProductButton = styled.button`
  display: flex;
  align-items: center;
  background-color: ${colors.primary};
  color: ${colors.white};
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
  text-decoration: none;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  i {
    margin-right: 8px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`;

const CartSection = styled.div``;

const DetailSection = styled.div``;

const SectionCard = styled(Card)`
  margin-bottom: 24px;
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

const CartItemsList = styled.div``;

const CartItem = styled.div`
  background-color: ${colors.white};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid ${colors.border};
`;

const CartItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const CartItemName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text};
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${colors.danger};
  cursor: pointer;
  font-size: 16px;

  &:hover {
    color: ${colors.danger}DD;
  }
`;

const CartItemBody = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  background-color: ${colors.background};
  border-radius: 8px;
  overflow: hidden;
`;

const QuantityButton = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: ${colors.text};

  &:hover {
    background-color: ${colors.border};
  }
`;

const QuantityValue = styled.div`
  width: 36px;
  text-align: center;
  font-weight: 500;
  color: ${colors.text};
`;

const PriceContainer = styled.div`
  text-align: right;
`;

const UnitPrice = styled.div`
  font-size: 14px;
  color: ${colors.textLight};
  margin-bottom: 4px;
`;

const SubtotalPrice = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.primary};
`;

const EmptyCart = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;

  i {
    font-size: 48px;
    color: ${colors.textMuted};
    margin-bottom: 16px;
  }
`;

const EmptyCartTitle = styled.h3`
  font-size: 20px;
  font-weight: bold;
  color: ${colors.text};
  margin-bottom: 8px;
`;

const EmptyCartText = styled.p`
  font-size: 16px;
  color: ${colors.textLight};
  text-align: center;
  margin-bottom: 24px;
`;

const PaymentMethods = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const PaymentMethod = styled.button`
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background-color: ${props =>
    props.selected ? `${colors.primary}15` : colors.white};
  border: 1px solid
    ${props => (props.selected ? colors.primary : colors.border)};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  i {
    font-size: 24px;
    color: ${props => (props.selected ? colors.primary : colors.textLight)};
    margin-bottom: 8px;
  }

  span {
    font-size: 14px;
    font-weight: 500;
    color: ${props => (props.selected ? colors.primary : colors.text)};
  }

  &:hover {
    background-color: ${props =>
      props.selected ? `${colors.primary}20` : colors.background};
  }
`;

const NotesInput = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 12px;
  background-color: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  color: ${colors.text};
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px ${colors.primary}20;
  }

  &::placeholder {
    color: ${colors.textMuted};
  }
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SummaryLabel = styled.div`
  font-size: 15px;
  color: ${colors.textLight};
`;

const SummaryValue = styled.div`
  font-size: 15px;
  color: ${colors.text};
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${colors.border};
  margin-bottom: 24px;
`;

const TotalLabel = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: ${colors.text};
`;

const TotalValue = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: ${colors.primary};
`;

const CheckoutButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${colors.success};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  i {
    margin-right: 8px;
  }

  &:hover {
    background-color: ${colors.success}DD;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    background-color: ${colors.textMuted};
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 2px solid white;
  animation: spin 1s ease infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

// Estilos del modal
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1001;
`;

const ModalContent = styled.div`
  position: relative;
  background-color: white;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  border-radius: 12px;
  z-index: 1002;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid ${colors.border};
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${colors.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  color: ${colors.textLight};
  cursor: pointer;

  &:hover {
    color: ${colors.text};
  }
`;

const SearchContainer = styled.div`
  position: relative;
  padding: 16px 24px;
  border-bottom: 1px solid ${colors.border};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 1px solid ${colors.border};
  border-radius: 8px;
  font-size: 15px;
  color: ${colors.text};

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px ${colors.primary}20;
  }

  &::placeholder {
    color: ${colors.textMuted};
  }
`;

const SearchIcon = styled.i`
  position: absolute;
  left: 40px;
  top: 50%;
  transform: translateY(-50%);
  color: ${colors.textLight};
`;

const ProductsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  max-height: 60vh;
`;

const ProductItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid ${colors.border};
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${colors.background};
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
`;

const ProductInfo = styled.div`
  flex: 1;
`;

const ProductName = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${colors.text};
  margin-bottom: 4px;
`;

const ProductSku = styled.div`
  font-size: 14px;
  color: ${colors.textLight};
  margin-bottom: 8px;
`;

const ProductDetails = styled.div`
  display: flex;
  gap: 16px;
`;

const ProductPrice = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.primary};
`;

const ProductStock = styled.div`
  font-size: 14px;
  color: ${colors.textLight};
`;

const AddToCartButton = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${colors.primary};
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 16px;

  &:hover {
    background-color: ${colors.primaryDark};
    transform: scale(1.1);
  }
`;

const EmptyResults = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
`;

const EmptyResultsText = styled.p`
  font-size: 16px;
  color: ${colors.textLight};
  text-align: center;
`;

export default SalesPage;
