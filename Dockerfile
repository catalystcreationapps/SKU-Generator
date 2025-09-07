FROM node:18-alpine

ENV SHOPIFY_API_KEY="8c0f07713752b48770bfbfa9785b33f5"
ENV HOST="https://final-sku.onrender.com"
ENV PORT=8081
ENV SCOPES="read_products,write_products"
ENV SHOPIFY_API_SECRET="29083b30c298a8b2af684fd83c8d27f6"
ENV MAUTIC_BASE="https://campaigns.appsfinal.com/api"
ENV MAUTIC_PASS="{J$zv.7sDD{ZRp6"
ENV MAUTIC_USER="approbot"
ENV DATABASE_URL="mongodb://mongo-db-tq9k:27017/final-sku"
EXPOSE 8081
WORKDIR /app
COPY web .
RUN npm install
RUN cd frontend && npm install && npm run build
CMD ["npm", "run", "serve"]
