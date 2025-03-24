// Важно: подключите supabase-keys.js перед app.js в index.html
// <script src="supabase-keys.js"></script>
// <script src="app.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Supabase клиента
    const supabase = window.Supabase.createClient(
        window.supabaseConfig.url,
        window.supabaseConfig.anonKey
    );
    
    // Временный ID пользователя (в продакшене заменить на реальную аутентификацию)
    const tempUserId = 'user1';

    // Бургер-меню
    const burger = document.querySelector('.burger');
    const navMenu = document.querySelector('.nav-menu');
    if (burger && navMenu) {
        burger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            burger.textContent = navMenu.classList.contains('active') ? '×' : '☰';
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Закрываем меню при клике на ссылку
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                burger.textContent = '☰';
                document.body.style.overflow = '';
            });
        });
    }

    // Pricing Modal
    const pricingTrigger = document.getElementById('pricing-trigger');
    const pricingModal = document.getElementById('pricing-modal');
    const pricingClose = document.getElementById('pricing-close');

    function openPricingModal() {
        pricingModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closePricingModal() {
        pricingModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (pricingTrigger && pricingModal && pricingClose) {
        pricingTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            openPricingModal();
        });

        pricingClose.addEventListener('click', closePricingModal);

        pricingModal.addEventListener('click', (e) => {
            if (e.target === pricingModal) {
                closePricingModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && pricingModal.classList.contains('active')) {
                closePricingModal();
            }
        });
    }

    // Drag-and-drop и загрузка CSV
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('csv-file');
const uploadButton = document.getElementById('upload-button');

if (dropZone && fileInput && uploadButton) {
    // Предотвращаем стандартное поведение браузера
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Визуальная обратная связь при перетаскивании
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('dragover');
        // Добавляем текст обратной связи
        const text = dropZone.querySelector('p');
        if (text) {
            text.textContent = 'Отпустите файл для загрузки';
            text.style.color = 'var(--primary-color)';
        }
    }

    function unhighlight(e) {
        dropZone.classList.remove('dragover');
        resetDropzoneText();
    }

    function resetDropzoneText() {
        const text = dropZone.querySelector('p');
        if (text) {
            text.textContent = 'Перетащите CSV файл или нажмите для выбора';
            text.style.color = 'var(--text-secondary)';
        }
    }

    // Обработка перетаскивания файла
    dropZone.addEventListener('drop', handleDrop, false);
    dropZone.addEventListener('click', () => fileInput.click());

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFile(file);
    }

    // Обработка выбора файла через input
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFile(file);
    });

    function handleFile(file) {
        if (!file) return;
        
        // Проверяем тип файла
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            showErrorMessage('Пожалуйста, загрузите файл в формате CSV');
            resetDropzoneText();
            return;
        }
        
        // Проверяем размер файла (максимум 10 МБ)
        if (file.size > 10 * 1024 * 1024) {
            showErrorMessage('Файл слишком большой. Максимальный размер: 10 МБ');
            resetDropzoneText();
            return;
        }

        // Показываем имя выбранного файла
        const text = dropZone.querySelector('p');
        if (text) {
            text.innerHTML = `<strong>${file.name}</strong> (${formatFileSize(file.size)})`;
            text.style.color = 'var(--text-color)';
        }
        
        // Добавляем класс для стилизации
        document.body.classList.add('file-selected');
        
        // Меняем текст кнопки
        uploadButton.textContent = 'Загрузить выбранный файл';
    }

    // Функция для форматирования размера файла
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Байт';
        const k = 1024;
        const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Функция для отображения ошибки
    function showErrorMessage(message) {
        // Создаем элемент для сообщения об ошибке
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            background: #ff5a5f;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            animation: slideIn 0.3s forwards;
        `;
        
        // Добавляем стили анимации
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // Добавляем сообщение на страницу
        document.body.appendChild(errorElement);
        
        // Автоматически скрываем сообщение через 5 секунд
        setTimeout(() => {
            errorElement.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                errorElement.remove();
            }, 300);
        }, 5000);
    }

    // Загрузка файла
    uploadButton.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) {
            showErrorMessage('Пожалуйста, выберите файл');
            return;
        }

        try {
            // Добавляем класс для отображения прогресса загрузки
            uploadButton.classList.add('uploading');
            uploadButton.textContent = 'Загрузка...';
            
            // Имитация загрузки с задержкой для демонстрации интерфейса
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const text = await file.text();
            const rows = text.split('\n').map(row => row.split(','));
            
            // Проверяем, соответствует ли структура ожидаемой
            if (rows.length < 2) {
                throw new Error('Файл не содержит данных');
            }
            
            // Пропускаем заголовок
            const data = rows.slice(1).map(row => {
                if (row.length < 3) {
                    throw new Error('Неверный формат данных');
                }
                return {
                    client_id: row[0],
                    date: row[1],
                    amount: parseFloat(row[2])
                };
            });

            // Сохраняем данные в Supabase
            const { error } = await supabase
                .from('purchases')
                .insert(data.map(item => ({
                    ...item,
                    user_id: tempUserId
                })));

            if (error) throw error;
            
            // Успешная загрузка
            showSuccessMessage('Данные успешно загружены');
            resetDropzoneText();
            resetFileInput();
            
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            showErrorMessage('Ошибка при загрузке файла: ' + error.message);
        } finally {
            // Убираем класс загрузки и возвращаем исходный текст кнопки
            uploadButton.classList.remove('uploading');
            uploadButton.textContent = 'Загрузить CSV';
            document.body.classList.remove('file-selected');
        }
    });
    
    // Функция для отображения успешного сообщения
    function showSuccessMessage(message) {
        const successElement = document.createElement('div');
        successElement.className = 'success-message';
        successElement.textContent = message;
        successElement.style.cssText = `
            background: #27ae60;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            animation: slideIn 0.3s forwards;
        `;
        
        document.body.appendChild(successElement);
        
        setTimeout(() => {
            successElement.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                successElement.remove();
            }, 300);
        }, 5000);
    }
    
    // Сбросить поле ввода файла
    function resetFileInput() {
        fileInput.value = '';
    }
}

    // RFM анализ
    const analyzeButton = document.getElementById('analyze-button');
    const resultsContainer = document.getElementById('results-container');

    if (analyzeButton && resultsContainer) {
        analyzeButton.addEventListener('click', async () => {
            try {
                // Получаем данные из Supabase
                const { data, error } = await supabase
                    .from('purchases')
                    .select('*')
                    .eq('user_id', tempUserId);

                if (error) throw error;

                // Группируем по клиентам
                const clients = {};
                data.forEach(purchase => {
                    if (!clients[purchase.client_id]) {
                        clients[purchase.client_id] = {
                            purchases: [],
                            total: 0
                        };
                    }
                    clients[purchase.client_id].purchases.push(purchase);
                    clients[purchase.client_id].total += purchase.amount;
                });

                // Рассчитываем RFM метрики
                const now = new Date();
                const results = Object.entries(clients).map(([clientId, data]) => {
                    const lastPurchase = new Date(Math.max(...data.purchases.map(p => new Date(p.date))));
                    const daysSinceLastPurchase = Math.floor((now - lastPurchase) / (1000 * 60 * 60 * 24));
                    
                    return {
                        clientId,
                        recency: daysSinceLastPurchase,
                        frequency: data.purchases.length,
                        monetary: data.total
                    };
                });

                // Отображаем результаты
                resultsContainer.innerHTML = results.map(result => `
                    <div class="result-card">
                        <h3>Клиент ${result.clientId}</h3>
                        <p>Recency: ${result.recency} дней</p>
                        <p>Frequency: ${result.frequency} покупок</p>
                        <p>Monetary: ${result.monetary} ₽</p>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Ошибка анализа:', error);
                alert('Ошибка при анализе данных');
            }
        });
    }

    // TODO: Перед продакшеном:
    // 1. Включить Row Level Security (RLS) в Supabase
    // 2. Добавить Foreign Key для user_id, связав с таблицей users
    // 3. Реализовать реальную аутентификацию вместо tempUserId
    // 4. Добавить валидацию входных данных
    // 5. Настроить CORS и другие настройки безопасности в Supabase
}); 