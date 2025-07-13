# --- Estágio de Build ---
# Usa uma imagem Node completa para instalar dependências de forma eficiente.
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Instala apenas as dependências de produção para manter a imagem final enxuta.
RUN npm ci --omit=dev

COPY . .

# --- Estágio de Produção ---
# Usa uma imagem base mínima para a execução, aumentando a segurança e diminuindo o tamanho.
FROM node:18-alpine

# Define um usuário não-root para maior segurança (best practice).
USER node

WORKDIR /home/node/app

# Copia as dependências e o código do estágio de build.
COPY --from=builder /usr/src/app .

CMD [ "node", "server.js" ]