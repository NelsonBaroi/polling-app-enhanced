# Stage 1: Build the app
FROM node:22-bullseye AS builder

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --build-from-source

# Copy source code
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]