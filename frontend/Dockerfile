FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Expose Next.js default port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
