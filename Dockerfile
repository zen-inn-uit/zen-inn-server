FROM node:20-alpine

WORKDIR /app

# Install dependencies based on package-lock.json first for caching
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Configure npm for better network resilience
RUN npm config set fetch-retry-maxtimeout 600000 \
    && npm config set fetch-retry-mintimeout 10000 \
    && npm config set fetch-retries 5 \
    && npm config set registry https://registry.npmjs.org/

RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "start:prod"]
