-- Farm Fresh Pet AI Chatbot - Snowflake Setup Script
-- Run this script to set up the necessary database, tables, and functions

-- 1. Create database and schema
CREATE DATABASE IF NOT EXISTS FARM_FRESH_PET_AI;
USE DATABASE FARM_FRESH_PET_AI;
CREATE SCHEMA IF NOT EXISTS CHATBOT;
USE SCHEMA CHATBOT;

-- 2. Create tables for RAG data
CREATE TABLE IF NOT EXISTS PRODUCTS (
    product_id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR,
    price DECIMAL(10,2),
    ingredients TEXT,
    nutritional_info TEXT,
    embedding VECTOR(FLOAT, 1536),  -- For embeddings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

CREATE TABLE IF NOT EXISTS ORDERS (
    order_id VARCHAR PRIMARY KEY,
    customer_email VARCHAR,
    order_date TIMESTAMP,
    status VARCHAR,
    tracking_number VARCHAR,
    items VARIANT,
    total_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

CREATE TABLE IF NOT EXISTS CHAT_HISTORY (
    session_id VARCHAR NOT NULL,
    message_id VARCHAR PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    role VARCHAR NOT NULL,
    content TEXT NOT NULL,
    metadata VARIANT,
    INDEX idx_session_timestamp (session_id, timestamp)
);

-- 3. Create logs directory for backend (run in terminal)
-- mkdir -p backend/logs

-- 4. Create vector search index (if supported in your Snowflake version)
-- Note: This syntax may vary based on Snowflake version
-- CREATE VECTOR SEARCH INDEX products_embedding_index
-- ON PRODUCTS(embedding)
-- METRIC_TYPE = 'COSINE';

-- 5. Create function for chat completion
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
        CONCAT(
            'You are a helpful customer service assistant for Farm Fresh Pet store. ',
            'Context: ', context, '\n\n',
            'Customer: ', prompt, '\n\n',
            'Assistant:'
        )
    )
$$;

-- 6. Create external access integration for OpenAI (optional)
CREATE OR REPLACE NETWORK RULE openai_network_rule
    MODE = EGRESS
    TYPE = HOST_PORT
    VALUE_LIST = ('api.openai.com:443');

CREATE OR REPLACE EXTERNAL ACCESS INTEGRATION openai_access_integration
    ALLOWED_NETWORK_RULES = (openai_network_rule)
    ENABLED = TRUE;

-- 7. Create secret for OpenAI API key (replace with your actual key)
-- CREATE OR REPLACE SECRET openai_api_key
--     TYPE = GENERIC_STRING
--     SECRET_STRING = 'sk-your-openai-api-key-here';

-- 8. Create UDF for OpenAI calls (optional)
CREATE OR REPLACE FUNCTION CALL_OPENAI_CHAT(prompt TEXT)
RETURNS TEXT
LANGUAGE PYTHON
RUNTIME_VERSION = '3.8'
HANDLER = 'call_openai'
EXTERNAL_ACCESS_INTEGRATIONS = (openai_access_integration)
-- SECRETS = ('openai_key' = openai_api_key)
PACKAGES = ('requests')
AS
$$
import requests
import json
# import _snowflake

def call_openai(prompt):
    # Uncomment and use if you have set up the secret
    # api_key = _snowflake.get_secret('openai_key')
    
    # For now, return a placeholder
    return "OpenAI integration not configured. Please set up the API key secret."
    
    # Actual implementation when API key is configured:
    # response = requests.post(
    #     'https://api.openai.com/v1/chat/completions',
    #     headers={
    #         'Authorization': f'Bearer {api_key}',
    #         'Content-Type': 'application/json'
    #     },
    #     json={
    #         'model': 'gpt-4-turbo-preview',
    #         'messages': [{'role': 'user', 'content': prompt}],
    #         'temperature': 0.7
    #     }
    # )
    # 
    # return response.json()['choices'][0]['message']['content']
$$;

-- 9. Insert sample products
INSERT INTO PRODUCTS (product_id, name, description, category, price, ingredients) VALUES
    ('P001', 'Premium Dog Food - Chicken & Rice', 'High-quality dog food with real chicken as the first ingredient. Perfect for adult dogs of all sizes.', 'Dog Food', 29.99, 'Chicken, Brown Rice, Barley, Chicken Meal, Peas, Sweet Potatoes, Chicken Fat, Natural Flavors, Vitamins and Minerals'),
    ('P002', 'Grain-Free Cat Food - Salmon', 'Nutritious grain-free formula for cats with sensitive stomachs. Made with wild-caught salmon.', 'Cat Food', 24.99, 'Salmon, Sweet Potato, Peas, Potato Protein, Chicken Meal, Dried Egg, Natural Flavors, Fish Oil, Vitamins and Minerals'),
    ('P003', 'Puppy Training Treats', 'Small, soft treats perfect for training puppies. Made with real beef and wholesome ingredients.', 'Treats', 12.99, 'Beef, Whole Wheat Flour, Carrots, Oats, Molasses, Glycerin, Natural Flavors'),
    ('P004', 'Senior Dog Food - Turkey & Vegetables', 'Specially formulated for senior dogs with joint support nutrients.', 'Dog Food', 34.99, 'Turkey, Brown Rice, Carrots, Spinach, Glucosamine, Chondroitin, Vitamins and Minerals'),
    ('P005', 'Kitten Food - Chicken Recipe', 'DHA-enriched formula for growing kittens to support brain development.', 'Cat Food', 22.99, 'Chicken, Chicken Meal, Rice, Corn Gluten Meal, Fish Oil (DHA source), Vitamins and Minerals');

-- 10. Insert sample orders
INSERT INTO ORDERS (order_id, customer_email, order_date, status, tracking_number, items, total_amount) VALUES
    ('ORD-001', 'customer1@example.com', CURRENT_TIMESTAMP() - INTERVAL '2 days', 'Shipped', 'TRK123456789', PARSE_JSON('[{"product_id": "P001", "quantity": 2, "price": 29.99}]'), 59.98),
    ('ORD-002', 'customer2@example.com', CURRENT_TIMESTAMP() - INTERVAL '5 days', 'Delivered', 'TRK987654321', PARSE_JSON('[{"product_id": "P002", "quantity": 1, "price": 24.99}, {"product_id": "P003", "quantity": 1, "price": 12.99}]'), 37.98),
    ('ORD-003', 'customer3@example.com', CURRENT_TIMESTAMP() - INTERVAL '1 day', 'Processing', NULL, PARSE_JSON('[{"product_id": "P004", "quantity": 1, "price": 34.99}]'), 34.99);

-- 11. Grant necessary permissions
GRANT USAGE ON DATABASE FARM_FRESH_PET_AI TO ROLE CORTEX_USER;
GRANT USAGE ON SCHEMA CHATBOT TO ROLE CORTEX_USER;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA CHATBOT TO ROLE CORTEX_USER;
GRANT USAGE ON ALL FUNCTIONS IN SCHEMA CHATBOT TO ROLE CORTEX_USER;

-- 12. Test the setup
SELECT 'Setup complete! Testing Cortex...' as status;

-- Test Cortex is available
SELECT SNOWFLAKE.CORTEX.COMPLETE(
    'mixtral-8x7b',
    'Say "Hello, Farm Fresh Pet chatbot is ready!" if you can see this message.'
) as test_response;