# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Development stage
FROM node:18-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for nodemon)
RUN npm ci

# Copy application files
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "dev"]