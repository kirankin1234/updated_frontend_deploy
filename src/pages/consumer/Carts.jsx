import React, { useState, useEffect } from "react";
import { Table, Typography, Button, InputNumber, Row, Col, Empty, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { ShoppingCartOutlined } from "@ant-design/icons";
import axios from "axios";
import { BASE_URL } from "../../API/BaseURL";

const { Title, Text } = Typography;

const CartPage = () => {
  const { cartItems, handleQuantityChange, handleRemoveItem, loading } = useCart();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [productDetails, setProductDetails] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const navigate = useNavigate();

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const productPromises = cartItems.map((item) =>
          axios.get(`${BASE_URL}/api/product/get-by/${item.productId}`)
        );

        const responses = await Promise.allSettled(productPromises); // Use Promise.allSettled instead of Promise.all

        const productsData = {};
        responses.forEach((response, index) => {
          if (response.status === "fulfilled") {
            const productId = cartItems[index].productId;
            productsData[productId] = response.value.data.product;
          } else {
            console.error(`Failed to fetch product ${cartItems[index].productId}:`, response.reason);
          }
        });

        setProductDetails(productsData);
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (cartItems.length > 0) {
      fetchProductDetails();
    } else {
      setLoadingProducts(false);
    }
  }, [cartItems]);

  // Loading state
  if (loading || loadingProducts) {
    return <div style={{ textAlign: "center", padding: "50px" }}>Loading...</div>;
  }

  // Calculate subtotal dynamically
  const calculateSubtotal = () => {
    return selectedRowKeys.reduce(
      (total, productId) =>
        total + (productDetails[productId]?.price || 0) * (cartItems.find((item) => item.productId === productId)?.quantity || 0),
      0
    );
  };

  const onSelectChange = (selectedKeys) => {
    setSelectedRowKeys(selectedKeys);
  };

  const handleCheckout = () => {
    if (selectedRowKeys.length === 0) {
      alert("Please select at least one product to proceed to checkout.");
      return;
    }

    const selectedProducts = cartItems
      .filter((item) => selectedRowKeys.includes(item.productId))
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

    navigate("/checkout", { state: { selectedProducts } });
  };

  // Table columns
  const columns = [
    {
      title: "Image",
      dataIndex: "productId",
      render: (productId) => {
        const imageUrl = productDetails[productId]?.image;
        if (!imageUrl) return <Text>No Image</Text>;

        const fullImageUrl = `${BASE_URL}/uploads/${imageUrl.replace("/uploads/", "")}`;

        return (
          <Tooltip title={<img src={fullImageUrl} alt="Preview" style={{ width: "200px", height: "200px", objectFit: "contain" }} />}>
            <img
              src={fullImageUrl}
              alt="Product"
              style={{
                width: "80px",
                height: "80px",
                objectFit: "contain",
                border: "1px solid #ddd",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Name",
      dataIndex: "productId",
      render: (productId) => <Text>{productDetails[productId]?.productName}</Text>,
    },
    {
      title: "Price",
      dataIndex: "productId",
      render: (productId) => `₹${productDetails[productId]?.price}`,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      render: (quantity, record) => (
        <InputNumber
          min={1}
          value={quantity}
          onChange={(value) => handleQuantityChange(value, record)}
          style={{ width: "60px" }}
        />
      ),
    },
    {
      title: "Total",
      render: (_, record) => `₹${(productDetails[record.productId]?.price || 0) * record.quantity}`,
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button
          type="link"
          danger
          onClick={() => handleRemoveItem(record)}
          style={{
            border: "2px solid #a0b3d6", // Faint navy blue
            color: "#2c3e50", // Deep but soft blue for text
            padding: "5px 10px",
            borderRadius: "5px",
            transition: "0.3s",
          }}
          onMouseOver={(e) => (e.target.style.color = "#1a2942")} // Darker blue on hover
          onMouseOut={(e) => (e.target.style.color = "#2c3e50")}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      {cartItems.length === 0 ? (
        <Empty description={<Title level={4}>Your cart is empty</Title>} />
      ) : (
        <>
          <Title level={2}>Your Cart ({cartItems.length} items)</Title>
          <Table
            dataSource={cartItems.map((item) => ({
              ...item,
              key: item.productId,
            }))}
            columns={columns}
            rowSelection={{
              selectedRowKeys,
              onChange: onSelectChange,
            }}
            pagination={false}
          />
          {/* Row for buttons */}
          <Row justify="space-between" style={{ marginTop: "30px" }}>
            {/* Continue Shopping Button */}
            <Col>
              <Button
                style={{
                  backgroundColor: "#40476D",
                  color: "white",
                  width: "180px",
                  borderRadius: "5px",
                }}
                type="primary"
                size="large"
                onClick={() => navigate("/")}
              >
                <ShoppingCartOutlined style={{ marginRight: "5px" }} />
                Continue Shopping
              </Button>
            </Col>

            {/* Checkout Button and Subtotal */}
            <Col>
              <div style={{ textAlign: "right" }}>
                {/* Subtotal Section */}
                <div style={{ marginBottom: "10px" }}>
                  <Text strong style={{ fontSize: "18px" }}>
                    Subtotal:
                  </Text>{" "}
                  ₹{calculateSubtotal()}
                </div>
                {/* Checkout Button */}
                <Button
                  style={{
                    backgroundColor: "#40476D",
                    color: "white",
                    width: "150px",
                    borderRadius: "5px",
                  }}
                  type="primary"
                  size="large"
                  onClick={handleCheckout}
                >
                  Checkout
                </Button>
              </div>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default CartPage;
