# Ural Front

React frontend для проекта `Ural`.

## Локальный Запуск

Из корня монорепозитория рекомендуется запускать весь стек через Docker Compose:

```bash
cp .env.example .env
docker compose up --build -d
```

Frontend будет доступен на `http://localhost:3000`.

В этом режиме контейнер `ural-front` получает `API_BASE_URL=http://localhost:10902`, поэтому запросы из браузера идут в `ural-aggregator` из корневого `docker-compose.yml`.

## Запуск Только Frontend

Если backend уже поднят из монорепозитория, frontend можно запустить отдельно:

```bash
cd ural-front
npm install
npm start
```

По умолчанию приложение использует `REACT_APP_API_BASE_URL=http://localhost:10902`. Для другого адреса агрегатора создайте локальный `.env` на основе `.env.example`.

## Runtime Config

Production-образ nginx на старте пишет `/usr/share/nginx/html/runtime-config.js`.
Значение берется из `API_BASE_URL`, затем из `REACT_APP_API_BASE_URL`, а при их отсутствии используется `http://localhost:10902`.
