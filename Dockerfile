FROM node:20.3.0-alpine AS development

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies with --legacy-peer-deps flag
RUN npm install --legacy-peer-deps

# Copy app source
COPY . .

# Build the app
RUN npm run build

FROM node:20.3.0-alpine AS production

# Set NODE_ENV
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies with --legacy-peer-deps flag
RUN npm ci --only=production --legacy-peer-deps

# Copy built app from development stage
COPY --from=development /usr/src/app/dist ./dist

# Command to run the app
CMD ["node", "dist/main"]