FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Renombrar el archivo .env.railway a .env
RUN if [ -f .env.railway ]; then mv .env.railway .env; fi

EXPOSE 5000

CMD ["node", "index.js"]
