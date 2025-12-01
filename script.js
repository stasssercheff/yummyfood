function openInstructionPopup() {
  const title = t('instruction_title');
  const content = t('instruction');

  const popup = document.getElementById("popup");       // используем существующий
  const popupMessage = document.getElementById("popup-message");

  if (!popup || !popupMessage) return;

  popupMessage.innerHTML = `
    <div class="popup-content">
      <h2>${title}</h2>
      <pre>${content}</pre>
      <button onclick="window.closePopup()">${t('close')}</button>
    </div>
  `;

  popup.classList.remove('hidden');
}

// app.js — merged i18n + app logic
document.addEventListener('DOMContentLoaded', async () => {
  // -------------------------
  // i18n loader + helpers
  // -------------------------
  const LANG_KEY = 'lang';
  let translations = {};
  let lang = localStorage.getItem(LANG_KEY)
             || document.documentElement.lang
             || 'ru';

  async function loadTranslations() {
    try {
      const res = await fetch('lang.json', {cache: "no-store"});
      translations = await res.json();
    } catch (err) {
      console.error('Ошибка загрузки lang.json', err);
      translations = {};
    }
  }

  function t(key) {
    if (!translations || !key) return key;
    const node = translations[key];
    if (!node) return key;
    return (node[lang] ?? node['ru'] ?? Object.values(node)[0] ?? key);
  }

  function applyTranslationsToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const value = t(key);
      if (value !== undefined) el.textContent = value;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const value = t(key);
      if (value !== undefined) el.placeholder = value;
    });
    document.querySelectorAll('[data-i18n-gramm]').forEach(el => {
      const key = el.getAttribute('data-i18n-gramm');
      const value = t(key);
      if (value !== undefined) el.textContent = value;
    });
    document.querySelectorAll('option[data-i18n]').forEach(opt => {
      const key = opt.getAttribute('data-i18n');
      opt.textContent = t(key);
    });

    const totalBar = document.getElementById('total-kbju-bar');
    if (totalBar) {
      if (totalBar.dataset.init !== "1") {
        totalBar.textContent = `${t('total') || 'ИТОГО'}: 0₫ — ${t('kbju') || 'К/Б/Ж/У'}: 0/0/0/0`;
      }
    }
  }

  function setLanguage(newLang) {
    if (!newLang) return;
    lang = newLang;
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    applyTranslationsToDOM();
    window.dispatchEvent(new CustomEvent('i18n:changed', {detail: {lang}}));
    updateTotals();
  }

  await loadTranslations();

  const form = document.getElementById("orderForm");
  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popup-message");
  const totalBar = document.getElementById("total-kbju-bar");
  const btnRu = document.getElementById('btn-ru');
  const btnEn = document.getElementById('btn-en');

  applyTranslationsToDOM();

  if (btnRu) btnRu.addEventListener('click', () => setLanguage('ru'));
  if (btnEn) btnEn.addEventListener('click', () => setLanguage('en'));

  function parseKbjuString(kbjuStr) {
    return kbjuStr.split('/').map(s => Number(s));
  }

  function updateTotals() {
    let totalKbju = [0,0,0,0];
    let totalPrice = 0;
    document.querySelectorAll('.dish').forEach(dish => {
      const select = dish.querySelector('select.qty');
      const qty = parseInt(select?.value) || 0;
      const price = parseInt(dish.querySelector('.price')?.dataset.price) || 0;
      const kbjuStr = dish.querySelector('.kbju')?.dataset.kbju;
      if (!kbjuStr || qty === 0) return;
      const kbju = parseKbjuString(kbjuStr);
      for (let i=0;i<4;i++) totalKbju[i] += (kbju[i] || 0) * qty;
      totalPrice += price * qty;
    });

    if (totalBar) {
      totalBar.dataset.init = "1";
      totalBar.textContent = `${t('total') || 'ИТОГО'}: ${totalPrice.toLocaleString()}₫ — ${t('kbju') || 'К/Б/Ж/У'}: ${totalKbju.join('/')}`;
    }
  }

  document.querySelectorAll('select.qty').forEach(select => {
    if (select.options.length === 0) {
      for (let i = 0; i <= 8; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        select.appendChild(option);
      }
    }
    select.addEventListener('change', updateTotals);
  });

  updateTotals();

  function getDishDisplayName(dish) {
    const nameEl = dish.querySelector('.dish-name');
    if (!nameEl) return '';
    const key = nameEl.getAttribute('data-i18n');
    if (key && translations[key]) {
      return translations[key][lang] ?? translations[key]['ru'] ?? nameEl.textContent.trim();
    }
    return nameEl.textContent.trim();
  }

  let popupShown = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const contactMethod = form.contactMethod.value.trim();
    const contactHandle = form.contactHandle.value.trim();
    const comment = form.comment.value.trim();

    const alertFill = translations['FillContacts'] ? (translations['FillContacts'][lang] ?? translations['FillContacts']['ru']) : (lang === 'ru' ? 'Заполните все контактные поля' : 'Fill in all contact fields');
    const alertChoose = translations['ChooseDish'] ? (translations['ChooseDish'][lang] ?? translations['ChooseDish']['ru']) : (lang === 'ru' ? 'Выберите хотя бы одно блюдо.' : 'Select at least one dish.');

    if (!name || !contactMethod || !contactHandle) {
      alert(alertFill);
      return;
    }

    const orderItems = [];
    let kbjuTotal = [0,0,0,0];
    let totalPrice = 0;

    document.querySelectorAll('.dish').forEach(dish => {
      const qty = parseInt(dish.querySelector('select.qty')?.value) || 0;
      const price = parseInt(dish.querySelector('.price')?.dataset.price) || 0;
      const kbjuStr = dish.querySelector('.kbju')?.dataset.kbju;
      if (!kbjuStr || qty === 0) return;

      const [k,b,j,u] = parseKbjuString(kbjuStr);
      const dishName = getDishDisplayName(dish);

      orderItems.push(`${dishName} — ${qty} ${t('portions') || (lang === 'ru' ? 'порц.' : 'portions')}`);

      kbjuTotal[0] += (k || 0) * qty;
      kbjuTotal[1] += (b || 0) * qty;
      kbjuTotal[2] += (j || 0) * qty;
      kbjuTotal[3] += (u || 0) * qty;

      totalPrice += price * qty;
    });

    if (orderItems.length === 0) {
      alert(alertChoose);
      return;
    }

    const emailBody = [
      `${t('NewOrderFrom') || (lang==='ru' ? 'Новый заказ от' : 'New order from')} ${name}`,
      `${t('Contact') || (lang==='ru' ? 'Контакт' : 'Contact')}: ${contactMethod} - ${contactHandle}`,
      `${t('Comment') || (lang==='ru' ? 'Комментарий' : 'Comment')}: ${comment}`,
      '',
      `${t('YourOrder') || (lang==='ru' ? 'Ваш заказ:' : 'Your order:')}`,
      orderItems.map((x,i)=>`${i+1}. ${x}`).join('\n'),
      '',
      `${t('total') || (lang==='ru' ? 'Итого:' : 'Total:')} ${totalPrice.toLocaleString()}₫ — ${t('kbju') || (lang==='ru' ? 'К/Б/Ж/У' : 'P/F/C/F')}: ${kbjuTotal.join('/')}`,
      '',
    ].join('\n');

    const orderHTML = `
      <ol style="margin:0; padding-left:18px; text-align:left;">
        ${orderItems.map(x => `<li>${x}</li>`).join('')}
      </ol>
      <br>
      <b>${t('total') || (lang==='ru' ? 'Итого:' : 'Total:')}</b> ${totalPrice.toLocaleString()}₫ — ${t('kbju') || (lang==='ru' ? 'К/Б/Ж/У' : 'P/F/C/F')}: ${kbjuTotal.join('/')}
    `;

    popupMessage.innerHTML = `
      <div style="font-family:Arial;font-size:12px;">
        <div><b>${name}</b>!</div>
        <div style="margin-top:6px;">${t('OrderSent') || (lang==='ru' ? 'Ваша заявка отправлена!' : 'Your order has been received!')}</div>
        <div style="margin:14px 0 6px;">${t('YourOrder') || (lang==='ru' ? 'Ваш заказ:' : 'Your order:')}</div>
        ${orderHTML}
        <div style="margin-top:16px;">${t('ContactSoon') || (lang==='ru' ? 'С вами скоро свяжутся. Благодарим за выбор YUMMY!' : 'We will contact you soon. Thank you for choosing YUMMY!')}</div>
      </div>
    `;
    popup.classList.remove('hidden');
    popupShown = true;

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          access_key: "14d92358-9b7a-4e16-b2a7-35e9ed71de43",
          subject: `${t('NewOrderFrom') || 'Новый заказ'} ${name}`,
          from_name: "Yummy Food Form",
          message: emailBody,
          reply_to: contactHandle,
          name: name
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(t('SendError') || (lang==='ru' ? 'Ошибка отправки формы.' : 'Form submission error.'));
      }
    } catch (err) {
      console.warn('Web3Forms error', err);
    }

    try {
      await fetch("https://api.telegram.org/bot8472899454:AAGiebKRLt6VMei4toaiW11bR2tIACuSFeo/sendMessage", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          chat_id: 7408180116,
          text: emailBody
        })
      });
    } catch (err) {
      console.warn('Telegram error', err);
    }

    form.reset();
    updateTotals();
  });

  // close popup function (глобально, для кнопки инструкции)
  window.closePopup = function() {
    popup.classList.add('hidden');
    popupShown = false;
  };

  window.addEventListener('i18n:changed', () => {
    applyTranslationsToDOM();
    updateTotals();
  });

});
