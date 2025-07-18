-- Gravity Farms Petfood AI Chatbot - Snowflake Setup Script
-- Run this script in your Snowflake console to set up the required database objects

-- 1. Create Database and Schema
CREATE DATABASE IF NOT EXISTS GRAVITY_FARMS_PETFOOD_AI;
USE DATABASE GRAVITY_FARMS_PETFOOD_AI;
CREATE SCHEMA IF NOT EXISTS CHATBOT;
USE SCHEMA CHATBOT;

-- 2. Create Tables
-- Products table for RAG search
CREATE TABLE IF NOT EXISTS PRODUCTS (
    product_id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR,
    price DECIMAL(10,2),
    ingredients TEXT,
    nutritional_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- Orders table for customer order lookups
CREATE TABLE IF NOT EXISTS ORDERS (
    order_id VARCHAR PRIMARY KEY,
    customer_email VARCHAR NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    status VARCHAR DEFAULT 'Processing',
    tracking_number VARCHAR,
    items VARIANT,
    total_amount DECIMAL(10,2),
    shipping_address VARIANT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- Chat history for conversation context
CREATE TABLE IF NOT EXISTS CHAT_HISTORY (
    session_id VARCHAR NOT NULL,
    message_id VARCHAR PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    role VARCHAR NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata VARIANT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_email ON ORDERS(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_date ON ORDERS(order_date);
CREATE INDEX IF NOT EXISTS idx_chat_session ON CHAT_HISTORY(session_id, timestamp);

-- 3. Insert Sample Data
-- Sample Products
INSERT INTO PRODUCTS (product_id, name, description, category, price, ingredients, nutritional_info)
VALUES
    ('PROD-001', 'Premium Adult Dog Food - Chicken & Rice', 
     'High-quality dog food with real chicken as the first ingredient, perfect for adult dogs of all breeds.',
     'Dog Food', 29.99, 
     'Chicken, Brown Rice, Chicken Meal, Barley, Peas, Chicken Fat, Natural Flavors, Vitamins and Minerals',
     'Crude Protein (min) 26%, Crude Fat (min) 15%, Crude Fiber (max) 4%, Moisture (max) 10%'),
    
    ('PROD-002', 'Grain-Free Cat Food - Wild Salmon', 
     'Nutritious grain-free formula with wild-caught salmon, ideal for cats with sensitive stomachs.',
     'Cat Food', 24.99, 
     'Salmon, Sweet Potatoes, Peas, Potato Protein, Chicken Meal, Chicken Fat, Natural Flavors',
     'Crude Protein (min) 32%, Crude Fat (min) 14%, Crude Fiber (max) 3%, Moisture (max) 10%'),
    
    ('PROD-003', 'Puppy Training Treats - Beef Flavor', 
     'Small, soft treats perfect for training puppies. Made with real beef and wholesome ingredients.',
     'Dog Treats', 12.99, 
     'Beef, Whole Wheat Flour, Glycerin, Carrots, Sweet Potatoes, Natural Beef Flavor',
     'Crude Protein (min) 15%, Crude Fat (min) 8%, Crude Fiber (max) 4%, Moisture (max) 20%'),
    
    ('PROD-004', 'Senior Dog Food - Joint Support Formula', 
     'Specially formulated for senior dogs with glucosamine and chondroitin for joint health.',
     'Dog Food', 34.99, 
     'Chicken Meal, Brown Rice, Oats, Chicken Fat, Glucosamine, Chondroitin, Vitamins and Minerals',
     'Crude Protein (min) 24%, Crude Fat (min) 12%, Crude Fiber (max) 5%, Moisture (max) 10%'),
    
    ('PROD-005', 'Organic Cat Treats - Tuna & Catnip', 
     'Organic treats made with real tuna and a touch of catnip for the ultimate feline delight.',
     'Cat Treats', 9.99, 
     'Organic Tuna, Organic Oat Flour, Organic Eggs, Organic Catnip, Natural Preservatives',
     'Crude Protein (min) 20%, Crude Fat (min) 10%, Crude Fiber (max) 3%, Moisture (max) 15%');

-- Sample Orders
INSERT INTO ORDERS (order_id, customer_email, order_date, status, tracking_number, items, total_amount, shipping_address)
VALUES
    ('ORD-001', 'john.doe@example.com', DATEADD('day', -3, CURRENT_TIMESTAMP()), 'Shipped', 'TRK-123456789',
     PARSE_JSON('[{"product_id": "PROD-001", "name": "Premium Adult Dog Food", "quantity": 2, "price": 29.99}]'),
     59.98,
     PARSE_JSON('{"street": "123 Main St", "city": "Portland", "state": "OR", "zip": "97201"}')),
    
    ('ORD-002', 'jane.smith@example.com', DATEADD('day', -1, CURRENT_TIMESTAMP()), 'Processing', NULL,
     PARSE_JSON('[{"product_id": "PROD-002", "name": "Grain-Free Cat Food", "quantity": 1, "price": 24.99}, {"product_id": "PROD-005", "name": "Organic Cat Treats", "quantity": 2, "price": 9.99}]'),
     44.97,
     PARSE_JSON('{"street": "456 Oak Ave", "city": "Seattle", "state": "WA", "zip": "98101"}')),
    
    ('ORD-003', 'pet.lover@example.com', DATEADD('day', -7, CURRENT_TIMESTAMP()), 'Delivered', 'TRK-987654321',
     PARSE_JSON('[{"product_id": "PROD-003", "name": "Puppy Training Treats", "quantity": 3, "price": 12.99}]'),
     38.97,
     PARSE_JSON('{"street": "789 Pine Rd", "city": "San Francisco", "state": "CA", "zip": "94102"}'));

-- 4. Create Cortex Functions
-- Function for chat completions
CREATE OR REPLACE FUNCTION CHATBOT_RESPONSE(
    prompt TEXT,
    context TEXT,
    model_name TEXT DEFAULT 'mixtral-8x7b'
)
RETURNS TEXT
LANGUAGE SQL
AS
$$
    SELECT SNOWFLAKE.CORTEX.COMPLETE(
        model_name,
        CONCAT(context, '\n\nUser: ', prompt, '\n\nAssistant:')
    )
$$;

-- Function to search products with relevance scoring
CREATE OR REPLACE FUNCTION SEARCH_PRODUCTS_RANKED(search_query TEXT)
RETURNS TABLE (
    product_id VARCHAR,
    name VARCHAR,
    description TEXT,
    category VARCHAR,
    price DECIMAL(10,2),
    relevance_score NUMBER
)
AS
$$
    SELECT 
        product_id,
        name,
        description,
        category,
        price,
        (
            CASE WHEN LOWER(name) LIKE LOWER(CONCAT('%', search_query, '%')) THEN 10 ELSE 0 END +
            CASE WHEN LOWER(description) LIKE LOWER(CONCAT('%', search_query, '%')) THEN 5 ELSE 0 END +
            CASE WHEN LOWER(category) LIKE LOWER(CONCAT('%', search_query, '%')) THEN 3 ELSE 0 END +
            CASE WHEN LOWER(ingredients) LIKE LOWER(CONCAT('%', search_query, '%')) THEN 2 ELSE 0 END
        ) as relevance_score
    FROM PRODUCTS
    WHERE relevance_score > 0
    ORDER BY relevance_score DESC
    LIMIT 5
$$;

-- 5. Grant Permissions (adjust based on your role structure)
-- GRANT USAGE ON DATABASE GRAVITY_FARMS_PETFOOD_AI TO ROLE <your_app_role>;
-- GRANT USAGE ON SCHEMA CHATBOT TO ROLE <your_app_role>;
-- GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA CHATBOT TO ROLE <your_app_role>;
-- GRANT USAGE ON ALL FUNCTIONS IN SCHEMA CHATBOT TO ROLE <your_app_role>;

-- 6. Verify Setup
SELECT 'Database Setup Complete!' as status;
SELECT COUNT(*) as product_count FROM PRODUCTS;
SELECT COUNT(*) as order_count FROM ORDERS;

-- Test Cortex function
SELECT CHATBOT_RESPONSE(
    'What products do you have for dogs?',
    'You are a helpful assistant for Gravity Farms Petfood.',
    'mixtral-8x7b'
) as test_response;