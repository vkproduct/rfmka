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
        }

        function unhighlight(e) {
            dropZone.classList.remove('dragover');
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
            
            if (file.type !== 'text/csv') {
                alert('Пожалуйста, загрузите CSV файл');
                return;
            }

            dropZone.querySelector('p').textContent = file.name;
        }

        // Загрузка файла
        uploadButton.addEventListener('click', async () => {
            const file = fileInput.files[0];
            if (!file) {
                alert('Пожалуйста, выберите файл');
                return;
            }

            try {
                const text = await file.text();
                const rows = text.split('\n').map(row => row.split(','));
                
                // Пропускаем заголовок
                const data = rows.slice(1).map(row => ({
                    client_id: row[0],
                    date: row[1],
                    amount: parseFloat(row[2])
                }));

                // Сохраняем данные в Supabase
                const { error } = await supabase
                    .from('purchases')
                    .insert(data.map(item => ({
                        ...item,
                        user_id: tempUserId
                    })));

                if (error) throw error;
                alert('Данные успешно загружены');
                dropZone.querySelector('p').textContent = 'Перетащите CSV сюда или кликните для выбора';
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                alert('Ошибка при загрузке файла');
            }
        });
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