# RFM Pro - Анализ клиентской базы

Веб-сервис для проведения RFM-анализа клиентской базы с использованием Supabase.

## Настройка проекта

1. Клонируйте репозиторий:
```bash
git clone https://github.com/your-username/rfm-pro.git
cd rfm-pro
```

2. Настройте Supabase:
   - Создайте проект на [Supabase](https://supabase.com)
   - В настройках проекта (Settings → API) найдите:
     - Project URL
     - anon public key
   - Создайте файл `config.js` на основе `config.example.js`
   - Вставьте ваши ключи в `config.js`

3. Настройте базу данных:
   - Создайте таблицу `purchases` с полями:
     - id (uuid, primary key)
     - user_id (uuid, foreign key)
     - client_id (text)
     - date (date)
     - amount (numeric)
   - Включите Row Level Security (RLS)
   - Настройте политики доступа

4. Запустите проект:
   - Откройте `index.html` в браузере
   - Или используйте локальный сервер:
     ```bash
     python -m http.server 8000
     ```

## Безопасность

- Не коммитьте файл `config.js` с реальными ключами
- Используйте `.env` файлы для локальной разработки
- В продакшене:
  - Включите RLS в Supabase
  - Настройте CORS
  - Используйте безопасную аутентификацию
  - Валидируйте все входные данные

## Лицензия

MIT 