// i18n.js
let currentLang = 'ru'; // язык по умолчанию
let translations = {};

// загружаем lang.json
fetch('lang.json')
  .then(response => response.json())
  .then(data => {
    translations = data;
    applyTranslations();
  })
  .catch(err => console.error('Ошибка загрузки словаря i18n:', err));

// функция для переключения языка
function setLang(lang) {
  currentLang = lang;
  applyTranslations();
}

// применяем переводы ко всем элементам
function applyTranslations() {
  if (!translations || Object.keys(translations).length === 0) return;

  // обычный текст
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key] && translations[key][currentLang]) {
      el.textContent = translations[key][currentLang];
    }
  });

  // плейсхолдеры
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[key] && translations[key][currentLang]) {
      el.placeholder = translations[key][currentLang];
    }
  });

  // граммы
  document.querySelectorAll('[data-i18n-gramm]').forEach(el => {
    const key = el.getAttribute('data-i18n-gramm');
    if (translations[key] && translations[key][currentLang]) {
      el.textContent = translations[key][currentLang];
    }
  });
}

// кнопки переключения языка
document.getElementById('btn-ru').addEventListener('click', () => setLang('ru'));
document.getElementById('btn-en').addEventListener('click', () => setLang('en'));
