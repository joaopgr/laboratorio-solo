# 1. IMAGEM BASE
FROM node:18-alpine

# 2. DEFINE O DIRETÓRIO DE TRABALHO
WORKDIR /app

# 3. COPIA package.json e instala dependências
# Copia o package.json da raiz e o package-lock.json
COPY package.json package-lock.json ./
RUN npm install

# 4. COPIA O RESTANTE DO CÓDIGO
COPY . .

# 5. GERAÇÃO DO CLIENTE PRISMA
# Assumindo que o seu schema.prisma está em 'backend/prisma/schema.prisma'
RUN npx prisma generate --schema=./backend/prisma/schema.prisma

# 6. PORTA DO SERVIDOR (Cloud Run Padrão)
EXPOSE 8080

# 7. COMANDO DE INICIALIZAÇÃO FINAL
# Usa o script 'dev:backend' que inicia o backend.
CMD ["npm", "run", "dev:backend"]