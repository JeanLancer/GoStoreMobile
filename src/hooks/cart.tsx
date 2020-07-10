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
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStorage = await AsyncStorage.getItem('@GoStore:products');
      if (productsStorage) {
        setProducts(JSON.parse(productsStorage));
      }

      // await AsyncStorage.clear();
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      let productsUpdated: Product[] = [];
      let isNewProduct = true;

      if (products.length > 0) {
        productsUpdated = products.map(item => {
          const newItem = item;
          if (newItem.id === product.id) {
            newItem.quantity += 1;
            isNewProduct = false;
          }

          return newItem;
        });
      }

      if (isNewProduct) {
        const newProduct: Product = product;

        newProduct.quantity = 1;

        setProducts([...products, newProduct]);
        await AsyncStorage.setItem(
          '@GoStore:products',
          JSON.stringify([...products, newProduct]),
        );
      } else {
        setProducts(productsUpdated);
        await AsyncStorage.setItem(
          '@GoStore:products',
          JSON.stringify(productsUpdated),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsUpdated = products.map(item => {
        const newItem = item;

        if (newItem.id === id) {
          newItem.quantity += 1;
        }
        return newItem;
      });

      setProducts(productsUpdated);
      await AsyncStorage.setItem(
        '@GoStore:products',
        JSON.stringify(productsUpdated),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      let productsUpdated: Product[] = [];
      let shouldRemove = false;

      productsUpdated = products.map(item => {
        const newItem = item;

        if (newItem.id === id) {
          newItem.quantity -= 1;
        }

        if (newItem.quantity <= 0) {
          shouldRemove = true;
        }

        return newItem;
      });

      if (shouldRemove) {
        productsUpdated = products.filter(item => item.id !== id);
      }

      setProducts(productsUpdated);
      await AsyncStorage.setItem(
        '@GoStore:products',
        JSON.stringify(productsUpdated),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
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
