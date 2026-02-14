# MacTech Training: Next.js + LibreOffice (headless) + pdftoppm for server-side slide images
FROM node:22-bookworm AS base

# Install LibreOffice (PPTX -> PDF) and poppler-utils (pdftoppm for PDF -> PNG per page)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    libreoffice-impress \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
