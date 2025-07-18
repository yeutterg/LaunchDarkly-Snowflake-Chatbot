// Mock data for demo mode when Snowflake/LaunchDarkly credentials are not available

const mockProducts = [
    {
        productId: 'PROD-001',
        name: 'Premium Adult Dog Food - Chicken & Rice',
        description: 'High-quality dog food with real chicken as the first ingredient',
        category: 'Dog Food',
        price: 29.99,
        ingredients: 'Chicken, Brown Rice, Chicken Meal, Barley, Peas, Chicken Fat, Natural Flavors'
    },
    {
        productId: 'PROD-002',
        name: 'Grain-Free Cat Food - Wild Salmon',
        description: 'Nutritious grain-free formula with wild-caught salmon',
        category: 'Cat Food',
        price: 24.99,
        ingredients: 'Salmon, Sweet Potatoes, Peas, Potato Protein, Chicken Meal'
    },
    {
        productId: 'PROD-003',
        name: 'Puppy Training Treats - Beef Flavor',
        description: 'Small, soft treats perfect for training puppies',
        category: 'Dog Treats',
        price: 12.99,
        ingredients: 'Beef, Whole Wheat Flour, Glycerin, Carrots, Sweet Potatoes'
    },
    {
        productId: 'PROD-004',
        name: 'Senior Dog Food - Joint Support',
        description: 'Specially formulated for senior dogs with glucosamine',
        category: 'Dog Food',
        price: 34.99,
        ingredients: 'Chicken Meal, Brown Rice, Oats, Chicken Fat, Glucosamine'
    },
    {
        productId: 'PROD-005',
        name: 'Organic Cat Treats - Tuna & Catnip',
        description: 'Organic treats made with real tuna and catnip',
        category: 'Cat Treats',
        price: 9.99,
        ingredients: 'Organic Tuna, Organic Oat Flour, Organic Eggs, Organic Catnip'
    }
];

const mockOrders = [
    {
        orderId: 'ORD-DEMO-001',
        customerEmail: 'demo@example.com',
        orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Shipped',
        trackingNumber: 'DEMO-TRK-123456',
        items: [
            { productId: 'PROD-001', name: 'Premium Adult Dog Food', quantity: 2, price: 29.99 }
        ],
        totalAmount: 59.98
    },
    {
        orderId: 'ORD-DEMO-002',
        customerEmail: 'demo@example.com',
        orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Processing',
        trackingNumber: null,
        items: [
            { productId: 'PROD-002', name: 'Grain-Free Cat Food', quantity: 1, price: 24.99 },
            { productId: 'PROD-005', name: 'Organic Cat Treats', quantity: 2, price: 9.99 }
        ],
        totalAmount: 44.97
    },
    {
        orderId: 'ORD-DEMO-003',
        customerEmail: 'test@example.com',
        orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Delivered',
        trackingNumber: 'DEMO-TRK-789012',
        items: [
            { productId: 'PROD-003', name: 'Puppy Training Treats', quantity: 3, price: 12.99 }
        ],
        totalAmount: 38.97
    }
];

const mockResponses = {
    greetings: [
        "Hello! I'm here to help with your Gravity Farms Petfood orders and products. How can I assist you today?",
        "Welcome to Gravity Farms! I can help you track orders, find products, or process returns. What would you like to do?",
        "Hi there! I'm your Gravity Farms assistant. Feel free to ask about orders, products, or returns!"
    ],
    
    orderNotFound: [
        "I couldn't find any orders associated with your account. Would you like to check with a different email address or order number?",
        "No orders found. Please make sure you're using the correct email address or order number.",
        "I don't see any orders for this account. If you just placed an order, it may take a few minutes to appear in our system."
    ],
    
    productNotFound: [
        "I couldn't find any products matching your search. Try different keywords or browse our categories: Dog Food, Cat Food, Treats.",
        "No products found for that search. Would you like to see our popular items instead?",
        "Sorry, I didn't find products matching your criteria. Can you be more specific about what you're looking for?"
    ],
    
    returnPolicy: "Our return policy allows returns within 30 days of purchase for unopened items. For opened items, we accept returns within 14 days if your pet has an adverse reaction (veterinary documentation required). To start a return, please provide your order number.",
    
    generalHelp: "I can help you with:\n• Tracking orders and checking order status\n• Finding products and checking prices\n• Processing returns and exchanges\n• General questions about our pet food\n\nWhat would you like assistance with?"
};

// Chat history storage (in-memory for demo)
const chatHistory = new Map();

module.exports = {
    mockProducts,
    mockOrders,
    mockResponses,
    chatHistory
};