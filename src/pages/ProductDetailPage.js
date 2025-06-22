import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { InventoryContext } from '../context/InventoryContext';
import { colors } from '../utils/constants';
import Button from '../components/Button';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, updateProduct, deleteProduct } =
    useContext(InventoryContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [product, setProduct] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    price: '',
    cost: '',
    quantity: '',
    imageUrl: '',
  });

  // Cargar datos del producto
  useEffect(() => {
    const productData = products.find(p => p.id === id);
    if (productData) {
      setProduct({
        name: productData.name || '',
        sku: productData.sku || '',
        description: productData.description || '',
        category: productData.category || '',
        price: productData.price ? productData.price.toString() : '',
        cost: productData.cost ? productData.cost.toString() : '',
        quantity: productData.quantity ? productData.quantity.toString() : '',
        imageUrl: productData.imageUrl || '',
      });
    } else {
      // Producto no encontrado, redirigir
      navigate('/inventory');
    }
  }, [id, products, navigate]);

  // Manejar cambios en los campos
  const handleChange = e => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  // Manejar la selección de imagen
  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar cambios en el producto
  const handleSave = async () => {
    if (!product.name) {
      alert('El nombre del producto es obligatorio');
      return;
    }

    try {
      setLoading(true);
      // Parsear valores numéricos
      const updatedProduct = {
        ...product,
        price: parseFloat(product.price) || 0,
        cost: parseFloat(product.cost) || 0,
        quantity: parseInt(product.quantity) || 0,
      };

      // Si hay una nueva imagen, usar el dataURL para enviar al servidor
      const imageToUpload = imagePreview || null;

      await updateProduct(id, updatedProduct, imageToUpload);
      setIsEditing(false);
      alert('Producto actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      alert('Error al actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  // Confirmar eliminación de producto
  const confirmDelete = () => {
    if (
      window.confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)
    ) {
      handleDelete();
    }
  };

  // Eliminar producto
  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteProduct(id);
      navigate('/inventory');
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      alert('Error al eliminar el producto');
      setLoading(false);
    }
  };

  // Calcular margen de beneficio
  const calculateProfit = () => {
    const price = parseFloat(product.price);
    const cost = parseFloat(product.cost);
    if (isNaN(price) || isNaN(cost) || price === 0) return 0;
    return ((price - cost) / price) * 100;
  };

  // Calcular valor total del inventario de este producto
  const calculateTotalValue = () => {
    const price = parseFloat(product.price);
    const quantity = parseInt(product.quantity);
    if (isNaN(price) || isNaN(quantity)) return 0;
    return price * quantity;
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
        <HeaderTitle>
          {isEditing ? 'Editar Producto' : 'Detalle de Producto'}
        </HeaderTitle>
        <ButtonGroup>
          {isEditing ? (
            <>
              <Button
                title="Cancelar"
                variant="outline"
                onClick={() => setIsEditing(false)}
              />
              <Button
                title="Guardar"
                variant="primary"
                onClick={handleSave}
                loading={loading}
              />
            </>
          ) : (
            <>
              <Button
                title="Eliminar"
                variant="danger"
                onClick={confirmDelete}
                loading={loading}
              />
              <Button
                title="Editar"
                variant="primary"
                onClick={() => setIsEditing(true)}
              />
            </>
          )}
        </ButtonGroup>
      </PageHeader>

      <ContentGrid>
        <ImageSection>
          <ImageContainer>
            {imagePreview ? (
              <ProductImage src={imagePreview} alt={product.name} />
            ) : product.imageUrl ? (
              <ProductImage src={product.imageUrl} alt={product.name} />
            ) : (
              <NoImage>
                <i className="fas fa-image"></i>
                <span>Sin imagen</span>
              </NoImage>
            )}
            {isEditing && (
              <ImageInputLabel>
                <ImageInput
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <span>Cambiar imagen</span>
              </ImageInputLabel>
            )}
          </ImageContainer>
        </ImageSection>

        <DetailsSection>
          <FormSection>
            <SectionTitle>Información Básica</SectionTitle>

            <FormGroup>
              <Label htmlFor="name">Nombre del Producto *</Label>
              {isEditing ? (
                <Input
                  id="name"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              ) : (
                <DisplayValue>{product.name}</DisplayValue>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="sku">SKU / Código</Label>
              {isEditing ? (
                <Input
                  id="sku"
                  name="sku"
                  value={product.sku}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              ) : (
                <DisplayValue>{product.sku || 'N/A'}</DisplayValue>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="category">Categoría</Label>
              {isEditing ? (
                <Input
                  id="category"
                  name="category"
                  value={product.category}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              ) : (
                <DisplayValue>
                  {product.category || 'Sin categoría'}
                </DisplayValue>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Descripción</Label>
              {isEditing ? (
                <Textarea
                  id="description"
                  name="description"
                  value={product.description}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={4}
                />
              ) : (
                <DisplayValue>
                  {product.description || 'Sin descripción'}
                </DisplayValue>
              )}
            </FormGroup>
          </FormSection>
        </DetailsSection>

        <PricingSection>
          <FormSection>
            <SectionTitle>Precios y Stock</SectionTitle>

            <FormGroup>
              <Label htmlFor="price">Precio de Venta *</Label>
              {isEditing ? (
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={product.price}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              ) : (
                <DisplayValue>
                  {formatCurrency(parseFloat(product.price) || 0)}
                </DisplayValue>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="cost">Costo *</Label>
              {isEditing ? (
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  value={product.cost}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              ) : (
                <DisplayValue>
                  {formatCurrency(parseFloat(product.cost) || 0)}
                </DisplayValue>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="quantity">Cantidad *</Label>
              {isEditing ? (
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={product.quantity}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              ) : (
                <DisplayValue>
                  {product.quantity} unidades
                  <StockIndicator
                    status={
                      parseInt(product.quantity) <= 0
                        ? 'out'
                        : parseInt(product.quantity) <= 5
                        ? 'low'
                        : 'in'
                    }
                  >
                    {parseInt(product.quantity) <= 0
                      ? 'Agotado'
                      : parseInt(product.quantity) <= 5
                      ? 'Stock Bajo'
                      : 'En Stock'}
                  </StockIndicator>
                </DisplayValue>
              )}
            </FormGroup>

            {!isEditing && (
              <>
                <FormGroup>
                  <Label>Margen de Beneficio</Label>
                  <DisplayValue>{calculateProfit().toFixed(2)}%</DisplayValue>
                </FormGroup>

                <FormGroup>
                  <Label>Valor Total</Label>
                  <DisplayValue>
                    {formatCurrency(calculateTotalValue())}
                  </DisplayValue>
                </FormGroup>
              </>
            )}
          </FormSection>
        </PricingSection>
      </ContentGrid>
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  grid-template-areas:
    'image details'
    'image pricing';
  gap: 24px;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      'image'
      'details'
      'pricing';
  }
`;

const ImageSection = styled.section`
  grid-area: image;
`;

const DetailsSection = styled.section`
  grid-area: details;
`;

const PricingSection = styled.section`
  grid-area: pricing;
`;

const FormSection = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text};
  margin-bottom: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${colors.textLight};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid ${colors.border};
  border-radius: 8px;
  background-color: ${props =>
    props.disabled ? colors.background : colors.white};
  font-size: 14px;
  color: ${colors.text};

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px ${colors.primary}20;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid ${colors.border};
  border-radius: 8px;
  background-color: ${props =>
    props.disabled ? colors.background : colors.white};
  font-size: 14px;
  font-family: inherit;
  color: ${colors.text};
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px ${colors.primary}20;
  }
`;

const DisplayValue = styled.div`
  font-size: 16px;
  color: ${colors.text};
  padding: 8px 0;
  display: flex;
  align-items: center;
`;

const ImageContainer = styled.div`
  width: 100%;
  aspect-ratio: 1;
  position: relative;
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const NoImage = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${colors.background};
  color: ${colors.textLight};

  i {
    font-size: 48px;
    margin-bottom: 16px;
  }
`;

const ImageInputLabel = styled.label`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 12px;
  text-align: center;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
  }
`;

const ImageInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
`;

const StockIndicator = styled.span`
  margin-left: 10px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;

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

export default ProductDetailPage;
