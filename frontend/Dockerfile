# Stage 1: Build the React Application
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package management files
COPY package.json package-lock.json* ./

# Install dependencies using clean install for reproducible builds
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the Vite React application for production
RUN npm run build

# Stage 2: Serve the Application using Nginx
FROM nginx:alpine

# Remove the default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled production build from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
