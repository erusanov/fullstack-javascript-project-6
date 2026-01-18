### Статус тестов Hexlet и линтера:
[![Actions Status](https://github.com/erusanov/fullstack-javascript-project-6/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/erusanov/fullstack-javascript-project-6/actions)

## Развернутое приложение

Приложение развернуто и доступно по адресу: [https://fullstack-javascript-project-6-z3wz.onrender.com/](https://fullstack-javascript-project-6-z3wz.onrender.com/)

## Установка

Для установки зависимостей проекта выполните:

```bash
make install
```

## Запуск тестов

Для запуска тестов используйте следующую команду:

```bash
make test
```

## Запуск сервера разработки (Development)

Для запуска приложения в режиме разработки:

```bash
make dev
```

## Запуск сервера (Production)

Для запуска приложения в production режиме:

```bash
make start
```

## Переменные среды

Переменные среды используются для настройки приложения. Вы можете задать их в следующих файлах:

*   `.env.development`: Для разработки.
*   `.env.test`: Для тестов.
*   `.env`: Для продакшена.

Пример содержимого файла `.env`:

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://user:password@host:port/database
SESSION_SECRET=supersecret
```