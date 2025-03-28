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

    // Drag-and-drop и загрузка файлов
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('csv-file');
    const uploadButton = document.getElementById('upload-button');
    const processButton = document.getElementById('process-button');
    const columnMapping = document.getElementById('column-mapping');
    const clientIdSelect = document.getElementById('client-id-column');
    const dateSelect = document.getElementById('date-column');
    const amountSelect = document.getElementById('amount-column');

    // Переменные для хранения данных из файла
    let fileData = null;
    let fileHeaders = [];

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

        function isValidFileType(file) {
            const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 
                                 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            return allowedTypes.includes(file.type) || 
                  file.name.endsWith('.csv') || 
                  file.name.endsWith('.xlsx') || 
                  file.name.endsWith('.xls');
        }

        async function handleFile(file) {
            if (!file) return;
            
            if (!isValidFileType(file)) {
                alert('Пожалуйста, загрузите CSV или Excel файл');
                return;
            }

            // Показываем имя файла
            dropZone.querySelector('p').textContent = file.name;
            
            try {
                // Определяем тип файла и парсим его
                if (file.name.endsWith('.csv')) {
                    await parseCSV(file);
                } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    await parseExcel(file);
                }
                
                // Активируем выбор столбцов
                columnMapping.classList.remove('hidden');
                processButton.classList.remove('hidden');
                uploadButton.classList.add('hidden');
                
            } catch (error) {
                console.error('Ошибка при чтении файла:', error);
                alert('Не удалось прочитать файл. Проверьте формат и попробуйте снова.');
            }
        }

        async function parseCSV(file) {
            const text = await file.text();
            
            // Используем простой парсер CSV
            const rows = text.split('\n').map(row => {
                // Поддержка как для запятых, так и для точек с запятой
                let separator = row.includes(';') ? ';' : ',';
                return row.split(separator).map(cell => cell.trim());
            });
            
            if (rows.length < 2) {
                throw new Error('Файл не содержит достаточно данных');
            }
            
            fileHeaders = rows[0];
            fileData = rows.slice(1).filter(row => row.length === fileHeaders.length);
            
            // Заполняем выпадающие списки
            populateColumnSelects(fileHeaders);
        }

        async function parseExcel(file) {
            // Используем SheetJS для работы с Excel
            // При необходимости добавьте <script src="https://unpkg.com/xlsx/dist/xlsx.full.min.js"></script> в index.html
            if (!window.XLSX) {
                throw new Error('Библиотека XLSX не найдена. Проверьте подключение библиотеки в HTML.');
            }
            
            const arrayBuffer = await file.arrayBuffer();
            const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
            
            // Берем первый лист
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Преобразуем в массив
            const data = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (data.length < 2) {
                throw new Error('Файл не содержит достаточно данных');
            }
            
            fileHeaders = data[0];
            fileData = data.slice(1).filter(row => row.length === fileHeaders.length);
            
            // Заполняем выпадающие списки
            populateColumnSelects(fileHeaders);
        }

        function populateColumnSelects(headers) {
            // Очищаем списки
            [clientIdSelect, dateSelect, amountSelect].forEach(select => {
                select.innerHTML = '';
                // Добавляем пустой вариант
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = '-- Выберите столбец --';
                select.appendChild(emptyOption);
            });
            
            // Заполняем варианты
            headers.forEach((header, index) => {
                [clientIdSelect, dateSelect, amountSelect].forEach(select => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = header;
                    select.appendChild(option);
                });
            });
            
            // Пытаемся определить подходящие столбцы автоматически
            autoDetectColumns(headers);
        }

        function autoDetectColumns(headers) {
            // Поиск по ключевым словам
            headers.forEach((header, index) => {
                const lowerHeader = header.toLowerCase();
                
                // ID клиента
                if (lowerHeader.includes('client') || lowerHeader.includes('клиент') || 
                    lowerHeader.includes('id') || lowerHeader.includes('customer')) {
                    clientIdSelect.value = index;
                }
                
                // Дата
                if (lowerHeader.includes('date') || lowerHeader.includes('дата') || 
                    lowerHeader.includes('time') || lowerHeader.includes('время')) {
                    dateSelect.value = index;
                }
                
                // Сумма
                if (lowerHeader.includes('amount') || lowerHeader.includes('сумма') || 
                    lowerHeader.includes('price') || lowerHeader.includes('стоимость') || 
                    lowerHeader.includes('total') || lowerHeader.includes('итого')) {
                    amountSelect.value = index;
                }
            });
        }

        // Обработка кнопки "Обработать данные"
        if (processButton) {
            processButton.addEventListener('click', processFileData);
        }

        async function processFileData() {
            // Получаем индексы выбранных столбцов
            const clientIdIdx = parseInt(clientIdSelect.value);
            const dateIdx = parseInt(dateSelect.value);
            const amountIdx = parseInt(amountSelect.value);
            
            // Проверяем, что все столбцы выбраны
            if (isNaN(clientIdIdx) || isNaN(dateIdx) || isNaN(amountIdx)) {
                alert('Пожалуйста, выберите все необходимые столбцы');
                return;
            }
            
            try {
                // Преобразуем данные в нужный формат
                const processedData = fileData.map(row => {
                    // Проверяем, что все нужные ячейки существуют
                    if (row[clientIdIdx] === undefined || row[dateIdx] === undefined || row[amountIdx] === undefined) {
                        return null; // Пропускаем строки с отсутствующими данными
                    }
                    
                    // Пытаемся преобразовать сумму в число
                    let amount = row[amountIdx];
                    if (typeof amount === 'string') {
                        // Заменяем запятую на точку, если это строка
                        amount = amount.replace(',', '.');
                        // Удаляем все нечисловые символы (кроме точки)
                        amount = amount.replace(/[^\d.-]/g, '');
                    }
                    
                    const parsedAmount = parseFloat(amount);
                    
                    // Если сумма не является числом, пропускаем строку
                    if (isNaN(parsedAmount)) {
                        return null;
                    }
                    
                    // Обрабатываем дату
                    let purchaseDate = row[dateIdx];
                    if (typeof purchaseDate === 'string') {
                        // Пытаемся разобрать различные форматы даты
                        const dateObj = parseDateString(purchaseDate);
                        if (dateObj) {
                            purchaseDate = dateObj.toISOString().split('T')[0]; // формат YYYY-MM-DD
                        } else {
                            return null; // Если дата некорректная, пропускаем строку
                        }
                    } else if (purchaseDate instanceof Date) {
                        // Если это объект Date (из Excel)
                        purchaseDate = purchaseDate.toISOString().split('T')[0];
                    }
                    
                    return {
                        client_id: row[clientIdIdx].toString(),
                        date: purchaseDate,
                        amount: parsedAmount
                    };
                }).filter(item => item !== null); // Исключаем пропущенные строки
                
                if (processedData.length === 0) {
                    alert('Не удалось обработать данные. Проверьте формат и выбранные столбцы.');
                    return;
                }
                
                // Сохраняем данные в Supabase
                const { error } = await supabase
                    .from('purchases')
                    .insert(processedData.map(item => ({
                        ...item,
                        user_id: tempUserId
                    })));
                
                if (error) throw error;
                
                alert(`Данные успешно загружены! Обработано ${processedData.length} записей.`);
                
                // Сбрасываем интерфейс
                resetUploadInterface();
                
                // Опционально - автоматически запускаем анализ
                if (document.getElementById('analyze-button')) {
                    document.getElementById('analyze-button').click();
                }
                
            } catch (error) {
                console.error('Ошибка при обработке данных:', error);
                alert('Произошла ошибка при обработке данных: ' + error.message);
            }
        }

        function resetUploadInterface() {
            // Сбрасываем интерфейс
            dropZone.querySelector('p').textContent = 'Перетащите CSV или Excel файл сюда или кликните для выбора';
            columnMapping.classList.add('hidden');
            processButton.classList.add('hidden');
            uploadButton.classList.remove('hidden');
            fileInput.value = '';
            fileData = null;
            fileHeaders = [];
        }

        function parseDateString(dateStr) {
            // Функция для попытки разбора различных форматов дат
            // Типичные форматы: DD.MM.YYYY, MM/DD/YYYY, YYYY-MM-DD
            
            // Убираем лишние пробелы
            dateStr = dateStr.trim();
            
            // Пробуем напрямую через Date.parse
            let date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date;
            }
            
            // Проверяем популярные форматы
            let day, month, year;
            
            // DD.MM.YYYY или DD,MM,YYYY (европейский формат)
            const euroFormat = dateStr.match(/(\d{1,2})[.,](\d{1,2})[.,](\d{4})/);
            if (euroFormat) {
                day = parseInt(euroFormat[1], 10);
                month = parseInt(euroFormat[2], 10) - 1; // Месяцы от 0 до 11
                year = parseInt(euroFormat[3], 10);
                return new Date(year, month, day);
            }
            
            // MM/DD/YYYY (американский формат)
            const usFormat = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (usFormat) {
                month = parseInt(usFormat[1], 10) - 1;
                day = parseInt(usFormat[2], 10);
                year = parseInt(usFormat[3], 10);
                return new Date(year, month, day);
            }
            
            // YYYY-MM-DD (ISO формат)
            const isoFormat = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (isoFormat) {
                year = parseInt(isoFormat[1], 10);
                month = parseInt(isoFormat[2], 10) - 1;
                day = parseInt(isoFormat[3], 10);
                return new Date(year, month, day);
            }
            
            // Если ничего не подошло, возвращаем null
            return null;
        }
    }

    // RFM анализ
    const analyzeButton = document.getElementById('analyze-button');
    const resultsContainer = document.getElementById('results-container');

    if (analyzeButton && resultsContainer) {
        analyzeButton.addEventListener('click', async () => {
            try {
                // Показываем индикатор загрузки
                analyzeButton.disabled = true;
                analyzeButton.innerHTML = '<span class="processing-indicator"></span> Анализ...';
                
                // Получаем данные из Supabase
                const { data, error } = await supabase
                    .from('purchases')
                    .select('*')
                    .eq('user_id', tempUserId);

                if (error) throw error;
                
                if (!data || data.length === 0) {
                    throw new Error('Нет данных для анализа. Загрузите файл с данными о покупках.');
                }

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
                    
                    // Рассчитываем RFM оценки от 1 до 5
                    // Recency: меньше дней = выше оценка
                    let recencyScore;
                    if (daysSinceLastPurchase <= 30) recencyScore = 5;
                    else if (daysSinceLastPurchase <= 60) recencyScore = 4;
                    else if (daysSinceLastPurchase <= 90) recencyScore = 3;
                    else if (daysSinceLastPurchase <= 180) recencyScore = 2;
                    else recencyScore = 1;
                    
                    // Frequency: больше покупок = выше оценка
                    const frequency = data.purchases.length;
                    let frequencyScore;
                    if (frequency >= 10) frequencyScore = 5;
                    else if (frequency >= 5) frequencyScore = 4;
                    else if (frequency >= 3) frequencyScore = 3;
                    else if (frequency >= 2) frequencyScore = 2;
                    else frequencyScore = 1;
                    
                    // Monetary: больше денег = выше оценка
                    const monetary = data.total;
                    
                    return {
                        clientId,
                        recency: daysSinceLastPurchase,
                        frequency,
                        monetary,
                        recencyScore,
                        frequencyScore
                    };
                });
                
                // Сортируем по сумме покупок для определения monetary score
                results.sort((a, b) => b.monetary - a.monetary);
                
                // Распределяем monetary score на основе квинтилей
                const resultsCount = results.length;
                const quintileSize = Math.ceil(resultsCount / 5);
                
                for (let i = 0; i < resultsCount; i++) {
                    if (i < quintileSize) results[i].monetaryScore = 5;
                    else if (i < quintileSize * 2) results[i].monetaryScore = 4;
                    else if (i < quintileSize * 3) results[i].monetaryScore = 3;
                    else if (i < quintileSize * 4) results[i].monetaryScore = 2;
                    else results[i].monetaryScore = 1;
                }
                
                // Вычисляем RFM-сегмент для каждого клиента
                results.forEach(result => {
                    const rfmScore = `${result.recencyScore}${result.frequencyScore}${result.monetaryScore}`;
                    
                    // Определяем сегмент
                    if (rfmScore.startsWith('555') || rfmScore.startsWith('554') || rfmScore.startsWith('544')) {
                        result.segment = 'VIP клиенты';
                        result.segmentClass = 'segment-vip';
                    } else if (rfmScore.startsWith('5') || (result.recencyScore >= 4 && result.frequencyScore >= 3)) {
                        result.segment = 'Активные клиенты';
                        result.segmentClass = 'segment-active';
                    } else if (result.recencyScore <= 2 && result.frequencyScore >= 3 && result.monetaryScore >= 3) {
                        result.segment = 'Уходящие ценные клиенты';
                        result.segmentClass = 'segment-leaving';
                    } else if (result.recencyScore <= 2 && result.frequencyScore <= 2 && result.monetaryScore >= 3) {
                        result.segment = 'Спящие ценные клиенты';
                        result.segmentClass = 'segment-sleep';
                    } else if (result.recencyScore >= 3 && result.frequencyScore <= 2 && result.monetaryScore <= 2) {
                        result.segment = 'Новые клиенты';
                        result.segmentClass = 'segment-new';
                    } else if (result.recencyScore <= 2 && result.frequencyScore <= 2 && result.monetaryScore <= 2) {
                        result.segment = 'Потерянные клиенты';
                        result.segmentClass = 'segment-lost';
                    } else {
                        result.segment = 'Стандартные клиенты';
                        result.segmentClass = 'segment-standard';
                    }
                });

                // Отображаем результаты
                resultsContainer.innerHTML = results.map(result => `
                    <div class="result-card ${result.segmentClass}">
                        <h3>Клиент ${result.clientId}</h3>
                        <div class="segment-badge">${result.segment}</div>
                        <div class="metrics-grid">
                            <div class="metric">
                                <div class="metric-value">${result.recencyScore}</div>
                                <div class="metric-label">Recency</div>
                                <div class="metric-detail">${result.recency} дней</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">${result.frequencyScore}</div>
                                <div class="metric-label">Frequency</div>
                                <div class="metric-detail">${result.frequency} покупок</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">${result.monetaryScore}</div>
                                <div class="metric-label">Monetary</div>
                                <div class="metric-detail">${result.monetary.toLocaleString('ru-RU')} ₽</div>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                // Добавляем сводную информацию
                const segmentCounts = {};
                results.forEach(result => {
                    if (!segmentCounts[result.segment]) {
                        segmentCounts[result.segment] = 0;
                    }
                    segmentCounts[result.segment]++;
                });
                
                const summaryHtml = `
                    <div class="summary-card">
                        <h3>Сводная информация</h3>
                        <p>Всего клиентов: ${results.length}</p>
                        <div class="segments-summary">
                            ${Object.entries(segmentCounts).map(([segment, count]) => `
                                <div class="segment-item">
                                    <div class="segment-name">${segment}:</div>
                                    <div class="segment-count">${count} (${Math.round(count / results.length * 100)}%)</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                
                resultsContainer.insertAdjacentHTML('afterbegin', summaryHtml);
                
                // Восстанавливаем кнопку
                analyzeButton.disabled = false;
                analyzeButton.textContent = 'Запустить анализ';
                
            } catch (error) {
                console.error('Ошибка анализа:', error);
                alert('Ошибка при анализе данных: ' + error.message);
                
                // Восстанавливаем кнопку
                analyzeButton.disabled = false;
                analyzeButton.textContent = 'Запустить анализ';
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