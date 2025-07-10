# Use uma imagem oficial do Nginx como base
FROM nginx:alpine

# Copia a configuração personalizada do Nginx para dentro do contêiner
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia apenas os arquivos do site para o diretório padrão do Nginx
COPY index.html styles.css script.js /usr/share/nginx/html/

# Exponha a porta padrão do Nginx
EXPOSE 80