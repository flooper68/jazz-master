FROM oven/bun:1.3.14

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .
RUN bun run build

CMD ["bun", "run", "start"]
