FROM node:22-bullseye

# Set working directory
WORKDIR /app

# Copy only package.json and package-lock.json first (for better layer caching)
COPY package*.json ./

# Install dependencies, including better-sqlite3
RUN npm install --build-from-source

# Copy the rest of your application
COPY . .

# Expose port
EXPOSE 5000

# Start the app
CMD ["node", "index.js"]
