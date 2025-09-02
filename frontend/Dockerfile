# Stage 1: Build React app
FROM node:20-alpine as builder

WORKDIR /app

# Copy package.json and package-lock.json first (cache deps)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve app with Nginx
FROM nginx:alpine

# Copy built static files from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom Nginx config if needed (optional)
COPY /nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
