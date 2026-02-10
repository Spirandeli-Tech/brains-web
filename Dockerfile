FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

# Copy application code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Run dev server with host 0.0.0.0 to make it accessible from outside the container
CMD ["yarn", "dev", "--host", "0.0.0.0"]
