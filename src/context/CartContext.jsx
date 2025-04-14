// Cart Context (CartContext.jsx)
import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../API/BaseURL";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  const fetchCartItems = async () => {
    try {
      if (!user) return;

      const response = await axios.get(`${BASE_URL}/api/cart/get/${userId}`);
      setCartItems(response.data);
    } catch (error) {
      console.error("Error fetching cart items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, [user, userId]);

  const addToCart = async (item) => {
    const response = await axios.post(`${BASE_URL}/api/cart/add`, item);
    fetchCartItems(); // Update cart items after adding a new item
  };

  const handleQuantityChange = async (value, record) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/api/cart/update/${userId}/${record.productId}`,
        {
          quantity: value,
        }
      );
      fetchCartItems(); // Update cart items after changing quantity
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handleRemoveItem = async (record) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/api/cart/remove/${userId}/${record.productId}`
      );
      fetchCartItems(); // Update cart items after removing an item
    } catch (error) {
      console.error("Error removing item:", error);
      alert("Failed to remove item. Please try again.");
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        handleQuantityChange,
        handleRemoveItem,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
