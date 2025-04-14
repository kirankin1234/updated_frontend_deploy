import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Row,
    Col,
    Typography,
    Button,
    Radio,
    InputNumber,
    Image,
    Spin,
    Tooltip,
    Modal,
    message,
    Rate,
} from "antd";
import axios from "axios";
import { useCart } from "../../context/CartContext";
import { BASE_URL } from "../../API/BaseURL";
import DOMPurify from 'dompurify';

import "./Product.css"; // Import CSS here

const { Title, Text } = Typography;

const Product = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [subProducts, setSubProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilters, setSelectedFilters] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(null);
    const [filterError, setFilterError] = useState(false);
    const { addToCart } = useCart();
    const [hasOnlyPrice, setHasOnlyPrice] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [reviewSubject, setReviewSubject] = useState("");
    const [comments, setComments] = useState("");
    const [reviews, setReviews] = useState([]);
    const [isReviewListOpen, setIsReviewListOpen] = useState(false);
    const [averageRating, setAverageRating] = useState(0);

    const EXCLUDED_FIELDS = [
        "_id",
        "productId",
        "createdAt",
        "updatedAt",
        "__v",
        "name",
    ];

    useEffect(() => {
        if (!id) {
            message.error("Product ID is missing!");
            return;
        }

        const fetchData = async () => {
            try {
                const [productRes, subProductsRes] = await Promise.all([
                    axios.get(`${BASE_URL}/api/product/get-by/${id}`),
                    axios.get(`${BASE_URL}/api/subproduct/product/${id}`),
                ]);

                setProduct(productRes.data.product);
                setSubProducts(subProductsRes.data);

                if (subProductsRes.data.length > 0) {
                    const firstSubproductKeys = Object.keys(subProductsRes.data[0]);
                    const onlyPrice =
                        firstSubproductKeys.length === 4 &&
                        firstSubproductKeys.includes("price");
                    setHasOnlyPrice(onlyPrice);
                } else {
                    setHasOnlyPrice(false);
                }
            } catch (error) {
                message.error("Failed to load product details.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        const findMatchingSubproduct = () => {
            if (Object.keys(selectedFilters).length === 0) {
                setPrice(null);
                setFilterError(false);
                return;
            }

            const matchingSub = subProducts.find((sub) => {
                return Object.keys(selectedFilters).every(
                    (key) => sub[key] === selectedFilters[key]
                );
            });

            if (matchingSub) {
                setPrice(matchingSub.price);
                setFilterError(false);
            } else {
                setPrice(null);
                setFilterError(Object.keys(selectedFilters).length > 0);
            }
        };

        findMatchingSubproduct();
    }, [selectedFilters, subProducts]);

    const getAvailableFilters = () => {
        const filters = {};
        subProducts.forEach((sub) => {
            Object.keys(sub).forEach((key) => {
                if (!EXCLUDED_FIELDS.includes(key) && sub[key]) {
                    filters[key] = filters[key] || new Set();
                    filters[key].add(sub[key]);
                }
            });
        });
        return filters;
    };

    const handleFilterChange = (filterKey, value) => {
        const newFilters = { ...selectedFilters };
        if (value) {
            newFilters[filterKey] = value;
        } else {
            delete newFilters[filterKey];
        }
        setSelectedFilters(newFilters);
    };

    const buildProductCode = () => {
        if (!product) return "";

        const filterOrder = ["size", "color", "height", "width"];
        const filterParts = filterOrder
            .map((key) => selectedFilters[key] || "")
            .filter((value) => value !== "")
            .join("-");

        return `${product.productCode}${filterParts ? `-${filterParts}` : ""}`;
    };

    const handleCartClick = async () => {
        const user = JSON.parse(localStorage.getItem("user"));

        if (!user) {
            Modal.confirm({
              title: "Login Required",
              content: "Please log in to continue.",
              okText: "Login",
              cancelText: "Cancel",
              onOk: () => navigate("/login"),
              okButtonProps: {
                style: {
                  backgroundColor: "#40476D",
                  color: "#fff",
                  border: "none",
                },
              },
              cancelButtonProps: {
                style: {
                  backgroundColor: "#40476D",
                  color: "#fff",
                  border: "none",
                },
              },
            });
            return;
          }
          

        try {
            let finalPrice = product.price;

            if (price) {
                finalPrice = price * quantity;
            }

            const cartItem = {
                key: `${product._id}-${buildProductCode()}`,
                name: product.productName,
                price: finalPrice,
                filters: selectedFilters,
                quantity,
                userId: user._id,
            };

            // Check if the product is already in the cart
            const existingCartItem = await axios.get(`${BASE_URL}/api/cart/get/${user._id}`)
                .then(response => response.data.find(item => item.productId === product._id))
                .catch(() => null);

            if (existingCartItem) {



               Modal.confirm({
  title: "Product Already Marked",
  content: "You have already marked this product. Do you want to add another one to your cart?",
  okText: "Yes, Add Another",
  cancelText: "No, Just Keep Marked",
  okButtonProps: {
    style: {
      backgroundColor: "#40476D",
      color: "#fff",
      borderColor: "#40476D"
    }
  },
  cancelButtonProps: {
    style: {
      backgroundColor: "#40476D",
      color: "#fff",
      borderColor: "#40476D"
    }
  },
  onOk: async () => {
    try {
      await axios.post(`${BASE_URL}/api/cart/add`, {
        userId: user._id,
        productId: product._id,
        name: product.productName,
        image: product.image,
        price: finalPrice,
        quantity,
        size: selectedFilters.size || null,
        color: selectedFilters.color || null,
      });

      addToCart(cartItem);
      message.success("Another item added to cart!");
    } catch (error) {
      message.error("Failed to add item to cart.");
    }
  },
  onCancel: () => {
    // Do nothing if the user cancels
  },
});






            } else {
                // If the product is not in the cart, add it directly
                try {
                    await axios.post(`${BASE_URL}/api/interested-users/add`, {
                        userName: `${user.firstName} ${user.lastName}`.trim() || "unknown User",
                        email: user.email,
                        phone: user.phone || "Not Provided",
                        productId: product._id
                    });

                    await axios.post(`${BASE_URL}/api/cart/add`, {
                        userId: user._id,
                        productId: product._id,
                        name: product.productName,
                        image: product.image,
                        price: finalPrice,
                        quantity,
                        size: selectedFilters.size || null,
                        color: selectedFilters.color || null,
                    });

                    addToCart(cartItem);
                    message.success("Item added to cart!");

                } catch (error) {
                    message.error("Failed to add item to cart.");
                }
            }
        } catch (error) {
            message.error("An error occurred.");
        }
    };

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setRating(0);
        setName("");
        setEmail("");
        setReviewSubject("");
        setComments("");
    };

    const handleOk = async () => {
        try {
            await axios.post(`${BASE_URL}/api/reviews`, {
                productId: id,
                rating: rating,
                name: DOMPurify.sanitize(name),
                email: DOMPurify.sanitize(email),
                reviewSubject: DOMPurify.sanitize(reviewSubject),
                comments: DOMPurify.sanitize(comments),
            });

            message.success("Review submitted successfully!");
            setIsModalOpen(false);
            setRating(0);
            setName("");
            setEmail("");
            setReviewSubject("");
            setComments("");
        } catch (error) {
            message.error("Failed to submit review.");
        }
    };

    const showReviews = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/reviews/${id}`);
            setReviews(response.data);
            setIsReviewListOpen(true);

            if (response.data && response.data.length > 0) {
                const totalRating = response.data.reduce(
                    (sum, review) => sum + review.rating,
                    0
                );
                setAverageRating(totalRating / response.data.length);
            } else {
                setAverageRating(0);
            }
        } catch (error) {
            message.error("Reviews are not avilable for this product.");
            setAverageRating(0);
            setReviews([]);
        }
    };

    const closeReviewListModal = () => {
        setIsReviewListOpen(false);
    };

    if (loading)
        return <Spin size="large" style={{ display: "block", margin: "20px auto" }} />;
    if (!product)
        return (
            <h2 style={{ color: "red", textAlign: "center" }}>
                ⚠ Product Not Found
            </h2>
        );

    const availableFilters = getAvailableFilters();
    const hasFilters = Object.keys(availableFilters).length > 0;

    const showFilterMessage = hasOnlyPrice;

    return (
        <div>
            <div
                style={{ padding: "20px", backgroundColor: "white", marginRight: "20px" }}
            >
                <Row gutter={24}>
                    <Col span={12}>
                        <Image
                            src={`${BASE_URL}/uploads/${product.image.replace(
                                "/uploads/",
                                ""
                            )}`}
                            alt={product.productName}
                            style={{ maxWidth: "100%", borderRadius: "0px" }}
                            onError={(e) => {
                                e.target.src = "/placeholder-image.png";
                            }}
                        />
                    </Col>
                    <Col span={12}>
                        <Title level={3}>{product.productName}</Title>
                        {price ? (
                            <Title level={4}>₹{price}</Title>
                        ) : filterError ? (
                            <Text type="danger">Selected combination not available</Text>
                        ) : showFilterMessage ? (
                            <Text>This product has only one option available</Text>
                        ) : (
                            <Title level={4}>₹{product.price}</Title>
                        )}

                        {/* Review Product and Average Rating */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {averageRating > 0 ? (
                                <Rate
                                    allowHalf
                                    defaultValue={averageRating}
                                    disabled
                                    style={{ fontSize: "18px" }}
                                />
                            ) : (
                                <span style={{ color: "#888" }}>★★★★★</span> // Placeholder for no reviews
                            )}
                            <span style={{ color: "#333", cursor: "pointer", textDecoration: "underline" }} onClick={showModal}>
                                Review Product
                            </span>
                        </div>


                        <Text>
                            Product Code: <strong>{buildProductCode()}</strong>
                        </Text>
                        <br />
                        <br />

                        {hasFilters &&
                            !hasOnlyPrice &&
                            Object.keys(availableFilters).map((filterKey) => (
                                <div key={filterKey}>
                                    <Text>
                                        {filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}:
                                    </Text>
                                    <div>
                                        <Radio.Group
                                            onChange={(e) =>
                                                handleFilterChange(filterKey, e.target.value)
                                            }
                                            value={selectedFilters[filterKey]}
                                        >
                                            {Array.from(availableFilters[filterKey]).map((value) => (
                                                <Radio.Button
                                                    key={value}
                                                    value={value}
                                                    style={
                                                        filterKey === "color"
                                                            ? {
                                                                backgroundColor: value,
                                                                color: "white",
                                                                borderRadius: "50%",
                                                                marginRight: "4px",
                                                            }
                                                            : { marginRight: "4px" }
                                                    }
                                                >
                                                    {filterKey === "color" ? "" : value}
                                                </Radio.Button>
                                            ))}
                                        </Radio.Group>
                                    </div>
                                    <br />
                                </div>
                            ))}

                        <Text>Quantity:</Text>
                        <div>
                            <InputNumber min={1} value={quantity} onChange={setQuantity} />
                        </div>
                        <br />
                         {/* "I'm Interested" Button */}
                         <div className="interested-button-container">
                            <Tooltip
                                title={
                                    hasOnlyPrice
                                        ? ""
                                        : price
                                            ? ""
                                            : "Please select valid filter combinations"
                                }
                            >
                                <Button
                                    className="button"
                                    style={{
                                        backgroundColor: "#40476D",
                                        width: "200px",
                                    }}
                                    type="primary"
                                    onClick={handleCartClick}
                                    disabled={filterError}
                                >
                                    Add to cart
                                </Button>
                            </Tooltip>
                        </div>

                        {/* "See Reviews" Button */}
                        <div className="review-button-container">
                        <Button
    className="button"
    style={{
        backgroundColor: "#40476D",
        width: "200px",
        color: "#fff",
        border: "none",
        height: "40px",
    }}
    type="primary"
    onClick={showReviews}
>
    See Reviews
</Button>

                        </div>
                    </Col>
                </Row>
            </div>

            {/* Review Modal */}
            <Modal
                title="Submit a Review"
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
            >
                <label>Rating:</label>
                <Rate onChange={setRating} value={rating} />

                <label>Name:</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <label>Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <label>Subject:</label>
                <input
                    type="text"
                    value={reviewSubject}
                    onChange={(e) => setReviewSubject(e.target.value)}
                />

                <label>Comments:</label>
                <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                />
            </Modal>

            {/* Review List Modal */}
            <Modal
                title="Product Reviews"
                open={isReviewListOpen}
                onCancel={closeReviewListModal}
                footer={[
                    <Button key="back" onClick={closeReviewListModal}>
                        Return
                    </Button>,
                ]}
            >
                {reviews.length > 0 ? (
                    reviews.map((review) => (
                        <div key={review._id} style={{ marginBottom: "15px", padding: "10px", border: "1px solid #ddd", borderRadius: "5px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
                                <div>
                                    <strong>{review.name}</strong>
                                    <Rate
                                        allowHalf
                                        defaultValue={review.rating}
                                        disabled
                                        style={{ fontSize: "12px" }}
                                    />
                                </div>
                                <small style={{ color: "#888" }}>{review.email}</small>
                            </div>
                            <p><strong>Subject:</strong> {review.reviewSubject}</p>
                            <p>{review.comments}</p>
                        </div>
                    ))
                ) : (
                    <p>No reviews available for this product.</p>
                )}
            </Modal>
        </div>
    );
};

export default Product;
