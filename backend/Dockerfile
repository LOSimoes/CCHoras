# Use uma imagem Node.js leve
FROM node:18-alpine

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos de dependência e instala (o * garante que package-lock.json seja copiado se existir)
COPY package*.json ./
RUN npm install

# Copia o resto do código da aplicação
COPY . .

# Expõe a porta que a aplicação vai rodar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD [ "npm", "start" ]