FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

FROM alpine:3.20
WORKDIR /out
COPY --from=build /app/www ./
CMD ["sh", "-c", "cp -a /out/. /dist/ && echo App PWA assets copied"]
