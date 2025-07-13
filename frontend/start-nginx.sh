#!/bin/sh

# Encerra o script imediatamente se um comando falhar.
set -e

# Define valores padrão para as variáveis, caso não sejam fornecidas.
# O Cloud Run sempre fornecerá a variável PORT.
export PORT=${PORT:-8080}

# Substitui os placeholders no template com os valores das variáveis de ambiente
# e cria o arquivo de configuração final do Nginx.
envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Exibe a configuração final nos logs do contêiner para facilitar a depuração.
echo "--- Iniciando Nginx com a seguinte configuração ---"
cat /etc/nginx/conf.d/default.conf

# Inicia o Nginx no modo "foreground". Isso é crucial para que o contêiner continue executando.
exec nginx -g 'daemon off;'