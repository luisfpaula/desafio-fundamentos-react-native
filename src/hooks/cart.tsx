import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
  DeleteToCart(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStorage = await AsyncStorage.getItem(
        '@gomarketplace:products',
      );

      // AsyncStorage.clear();

      if (productsStorage) {
        setProducts([...JSON.parse(productsStorage)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      // Novo array necessário para resolver bug de inserir item no carrinho e
      // não salvar no storage
      let newProducts: Product[] = [];

      const itemExist = products.find(item => item.id === product.id);

      if (itemExist) {
        newProducts = products.map(item =>
          item.id === product.id
            ? { ...product, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        const newProduct = { ...product, quantity: 1 };

        newProducts = [...products];
        newProducts.push(newProduct);
      }

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@gomarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProductsIncrement = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(newProductsIncrement);

      await AsyncStorage.setItem(
        '@gomarketplace:products',
        JSON.stringify(newProductsIncrement),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProductsDecrement = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );

      setProducts(newProductsDecrement);

      await AsyncStorage.setItem(
        '@gomarketplace:products',
        JSON.stringify(newProductsDecrement),
      );
    },
    [products],
  );

  const DeleteToCart = useCallback(
    async id => {
      const oldProducts = [...products];

      const indexProduct = products.findIndex(product => product.id === id);

      if (indexProduct !== -1) {
        oldProducts.splice(indexProduct, 1);
        setProducts(oldProducts);

        await AsyncStorage.setItem(
          '@gomarketplace:products',
          JSON.stringify(oldProducts),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, DeleteToCart, products }),
    [products, addToCart, increment, decrement, DeleteToCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
