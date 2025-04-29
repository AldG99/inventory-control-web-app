import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { InventoryContext } from '../context/InventoryContext';
import { colors } from '../utils/constants';

const AddProductPage = () => {
  // Estados para los campos del producto
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [quantity, setQuantity] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados para el modal de categorías
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);

  const navigate = useNavigate();
  const { addProduct, categories, addCategory } = useContext(InventoryContext);

  // Filtrar categorías según la búsqueda
  useEffect(() => {
    if (categorySearch.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [categorySearch, categories]);

  // Función para seleccionar una imagen del dispositivo
  const pickImage = async () => {
    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';

      fileInput.onchange = e => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setImage(reader.result);
          };
          reader.readAsDataURL(file);
        }
      };

      fileInput.click();
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      alert('No se pudo seleccionar la imagen');
    }
  };

  // Función para guardar el producto
  const handleSaveProduct = async () => {
    // Validaciones básicas
    if (!name.trim()) {
      alert('El nombre del producto es obligatorio');
      return;
    }

    // Convertir a números
    const priceNumber = parseFloat(price);
    const costNumber = parseFloat(cost);
    const quantityNumber = parseInt(quantity);

    // Validar que sean números válidos
    if (isNaN(priceNumber) || priceNumber <= 0) {
      alert('El precio debe ser un número mayor que cero');
      return;
    }

    if (isNaN(costNumber) || costNumber <= 0) {
      alert('El costo debe ser un número mayor que cero');
      return;
    }

    if (isNaN(quantityNumber) || quantityNumber < 0) {
      alert('La cantidad debe ser un número válido no negativo');
      return;
    }

    try {
      setLoading(true);

      // Crear el objeto de producto
      const productData = {
        name,
        sku: sku.trim() || null,
        description: description.trim() || null,
        category: category.trim() || 'Sin categoría',
        price: priceNumber,
        cost: costNumber,
        quantity: quantityNumber,
      };

      // Verificar que image sea una URI válida antes de pasarla
      const imageToUpload = image && typeof image === 'string' ? image : null;

      // Añadir el producto a Firestore
      await addProduct(productData, imageToUpload);

      if (
        window.confirm(
          'Producto añadido correctamente. ¿Deseas añadir otro producto?'
        )
      ) {
        // Reiniciar el formulario pero mantener la categoría seleccionada
        const selectedCategory = category;
        resetForm();
        setCategory(selectedCategory);
      } else {
        // Navegar a la página de inventario
        navigate('/inventory');
      }
    } catch (error) {
      console.error('Error al guardar producto:', error);
      alert('No se pudo guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  // Función para resetear el formulario
  const resetForm = () => {
    setName('');
    setSku('');
    setDescription('');
    setPrice('');
    setCost('');
    setQuantity('');
    setImage(null);
    // No reseteamos la categoría para poder añadir varios productos de la misma categoría
  };

  // Seleccionar una categoría del modal
  const selectCategory = categoryName => {
    setCategory(categoryName);
    setShowCategoryModal(false);
    setCategorySearch('');
  };

  // Función para añadir una nueva categoría desde el modal
  const addNewCategory = async () => {
    if (categorySearch.trim() === '') {
      alert('Ingresa un nombre para la categoría');
      return;
    }

    // Comprobar si la categoría ya existe
    const exists = categories.some(
      cat => cat.name.toLowerCase() === categorySearch.toLowerCase()
    );

    if (exists) {
      alert('Esta categoría ya existe, selecciónala de la lista');
      return;
    }

    try {
      setLoading(true);
      // Llamar a la función para añadir la categoría a la base de datos
      await addCategory({ name: categorySearch.trim() });

      setCategory(categorySearch);
      setShowCategoryModal(false);
      setCategorySearch('');
    } catch (error) {
      console.error('Error al añadir categoría:', error);
      alert('No se pudo guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <Header>
        <HeaderTitle>Añadir Producto</HeaderTitle>
      </Header>

      <ContentContainer>
        <ScrollView>
          {/* Sección de imagen */}
          <ImageSection>
            <ImageContainer onClick={pickImage}>
              {image ? (
                <ProductImage src={image} alt="Imagen del producto" />
              ) : (
                <ImagePlaceholder>
                  <i
                    className="fas fa-camera"
                    style={{ fontSize: '24px', color: colors.textMuted }}
                  ></i>
                  <ImagePlaceholderText>Añadir imagen</ImagePlaceholderText>
                </ImagePlaceholder>
              )}
            </ImageContainer>
          </ImageSection>

          {/* Información básica */}
          <Section>
            <SectionTitle>Información Básica</SectionTitle>

            <InputContainer>
              <InputLabel>Nombre del Producto *</InputLabel>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nombre del producto"
              />
            </InputContainer>

            <InputContainer>
              <InputLabel>SKU / Código</InputLabel>
              <Input
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="Código único del producto (opcional)"
              />
            </InputContainer>

            <InputContainer>
              <InputLabel>Descripción</InputLabel>
              <TextArea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descripción del producto"
                rows={4}
              />
            </InputContainer>

            <InputContainer>
              <InputLabel>Categoría</InputLabel>
              <CategorySelector onClick={() => setShowCategoryModal(true)}>
                <CategoryInput
                  value={category}
                  placeholder="Seleccionar categoría"
                  readOnly
                />
                <i
                  className="fas fa-chevron-down"
                  style={{ color: colors.textLight }}
                ></i>
              </CategorySelector>
            </InputContainer>
          </Section>

          {/* Precios y Stock */}
          <Section>
            <SectionTitle>Precios y Stock</SectionTitle>

            <InputContainer>
              <InputLabel>Precio de Venta *</InputLabel>
              <Input
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
              />
            </InputContainer>

            <InputContainer>
              <InputLabel>Costo *</InputLabel>
              <Input
                value={cost}
                onChange={e => setCost(e.target.value)}
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
              />
            </InputContainer>

            <InputContainer>
              <InputLabel>Cantidad Inicial *</InputLabel>
              <Input
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="0"
                type="number"
                min="0"
              />
            </InputContainer>
          </Section>
        </ScrollView>

        {/* Botones de acción */}
        <ActionButtons>
          <CancelButton onClick={() => navigate(-1)} disabled={loading}>
            Cancelar
          </CancelButton>

          <SaveButton onClick={handleSaveProduct} disabled={loading}>
            {loading ? <LoadingSpinner /> : 'Guardar Producto'}
          </SaveButton>
        </ActionButtons>

        {/* Modal de selector de categoría */}
        {showCategoryModal && (
          <ModalOverlay>
            <ModalContainer>
              <ModalHeader>
                <ModalTitle>Seleccionar Categoría</ModalTitle>
                <CloseButton
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategorySearch('');
                  }}
                >
                  <i className="fas fa-times" style={{ fontSize: '20px' }}></i>
                </CloseButton>
              </ModalHeader>

              <SearchContainer>
                <SearchBar>
                  <i
                    className="fas fa-search"
                    style={{ color: colors.textLight }}
                  ></i>
                  <SearchInput
                    value={categorySearch}
                    onChange={e => setCategorySearch(e.target.value)}
                    placeholder="Buscar o crear categoría"
                    autoFocus
                  />
                  {categorySearch && (
                    <ClearSearchButton onClick={() => setCategorySearch('')}>
                      <i
                        className="fas fa-times-circle"
                        style={{ color: colors.textLight }}
                      ></i>
                    </ClearSearchButton>
                  )}
                </SearchBar>
              </SearchContainer>

              {categorySearch.trim() !== '' &&
                !filteredCategories.some(
                  cat => cat.name.toLowerCase() === categorySearch.toLowerCase()
                ) && (
                  <AddNewCategoryButton onClick={addNewCategory}>
                    <i
                      className="fas fa-plus-circle"
                      style={{ color: colors.primary }}
                    ></i>
                    <AddNewCategoryText>
                      Añadir "{categorySearch}" como nueva categoría
                    </AddNewCategoryText>
                  </AddNewCategoryButton>
                )}

              <CategoriesList>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((item, index) => (
                    <CategoryItem
                      key={item.id || index.toString()}
                      onClick={() => selectCategory(item.name)}
                    >
                      <CategoryName>{item.name}</CategoryName>
                      <i
                        className="fas fa-chevron-right"
                        style={{ color: colors.textLight }}
                      ></i>
                    </CategoryItem>
                  ))
                ) : (
                  <EmptyListContainer>
                    <EmptyListText>
                      {categorySearch.trim() !== ''
                        ? 'No se encontraron categorías. Puedes añadir una nueva.'
                        : 'No hay categorías disponibles'}
                    </EmptyListText>
                  </EmptyListContainer>
                )}
              </CategoriesList>
            </ModalContainer>
          </ModalOverlay>
        )}
      </ContentContainer>
    </PageContainer>
  );
};

// Estilos
const PageContainer = styled.div`
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

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: 80px; /* Espacio para los botones de acción */
`;

const ScrollView = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
`;

const ImageSection = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
`;

const ImageContainer = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background-color: ${colors.white};
  border: 1px dashed ${colors.border};
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  @media (min-width: 768px) {
    width: 250px;
    height: 250px;
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const ImagePlaceholderText = styled.span`
  margin-top: 8px;
  color: ${colors.textLight};
  font-size: 14px;
`;

const Section = styled.div`
  background-color: ${colors.white};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: bold;
  color: ${colors.text};
  margin-bottom: 16px;
`;

const InputContainer = styled.div`
  margin-bottom: 16px;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 16px;
  margin-bottom: 8px;
  color: ${colors.text};
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  background-color: ${colors.background};
  border-radius: 8px;
  padding: 12px;
  border: 1px solid ${colors.border};
  font-size: 16px;
  color: ${colors.text};

  &::placeholder {
    color: ${colors.textMuted};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  background-color: ${colors.background};
  border-radius: 8px;
  padding: 12px;
  border: 1px solid ${colors.border};
  font-size: 16px;
  color: ${colors.text};
  resize: vertical;

  &::placeholder {
    color: ${colors.textMuted};
  }
`;

const CategorySelector = styled.div`
  display: flex;
  align-items: center;
  background-color: ${colors.background};
  border-radius: 8px;
  border: 1px solid ${colors.border};
  padding-right: 12px;
  cursor: pointer;
`;

const CategoryInput = styled.input`
  flex: 1;
  font-size: 16px;
  padding: 12px;
  color: ${colors.text};
  background: transparent;
  border: none;
  cursor: pointer;

  &::placeholder {
    color: ${colors.textMuted};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  padding: 16px;
  background-color: ${colors.white};
  border-top: 1px solid ${colors.border};
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
`;

const CancelButton = styled.button`
  flex: 1;
  height: 48px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
  border: 1px solid ${colors.border};
  background-color: ${colors.white};
  color: ${colors.text};
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SaveButton = styled.button`
  flex: 2;
  height: 48px;
  background-color: ${colors.primary};
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 8px;
  border: none;
  color: ${colors.white};
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(108, 99, 255, 0.2);

  &:disabled {
    background-color: ${colors.textMuted};
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: ${colors.white};
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
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
  align-items: flex-end;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: ${colors.white};
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  width: 100%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    max-height: 60vh;
    max-width: 600px;
    margin: auto;
    border-radius: 16px;
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
  padding: 4px;
`;

const SearchContainer = styled.div`
  padding: 16px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background-color: ${colors.background};
  border-radius: 8px;
  padding: 0 12px;
  height: 48px;
  border: 1px solid ${colors.border};
`;

const SearchInput = styled.input`
  flex: 1;
  margin-left: 8px;
  font-size: 16px;
  color: ${colors.text};
  background: transparent;
  border: none;

  &::placeholder {
    color: ${colors.textMuted};
  }
`;

const ClearSearchButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
`;

const CategoriesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
`;

const CategoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid ${colors.border};
  cursor: pointer;

  &:hover {
    background-color: ${colors.background};
  }
`;

const CategoryName = styled.span`
  font-size: 16px;
  color: ${colors.text};
`;

const AddNewCategoryButton = styled.button`
  display: flex;
  align-items: center;
  padding: 16px;
  border: none;
  border-bottom: 1px solid ${colors.border};
  background-color: ${colors.primary}10;
  width: 100%;
  text-align: left;
  cursor: pointer;
`;

const AddNewCategoryText = styled.span`
  margin-left: 8px;
  font-size: 16px;
  color: ${colors.primary};
`;

const EmptyListContainer = styled.div`
  padding: 32px 16px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const EmptyListText = styled.span`
  font-size: 16px;
  color: ${colors.textLight};
  text-align: center;
`;

export default AddProductPage;
