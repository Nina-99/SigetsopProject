# Stage 1: Build
FROM node:20-alpine AS build-stage

WORKDIR /app

# Argumentos para inyectar variables de entorno en tiempo de build
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_SERVER_IP
ARG VITE_IP_URL
ARG VITE_SOCKET_URL

# Convertir ARG en ENV para que Vite los detecte
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_SERVER_IP=$VITE_SERVER_IP
ENV VITE_IP_URL=$VITE_IP_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --legacy-peer-deps --fetch-timeout=1000000

# Copy project files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built files from build-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
