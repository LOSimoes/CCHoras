# Use uma imagem oficial do Nginx como base
FROM nginx:alpine

# Copia a configuração personalizada do Nginx para dentro do contêiner
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia apenas os arquivos do site para o diretório padrão do Nginx
# Copy the main HTML and CSS files
COPY index.html styles.css /usr/share/nginx/html/
# Copy the entire 'js' directory with the new modules
COPY js/ /usr/share/nginx/html/js/

# Exponha a porta padrão do Nginx
EXPOSE 80