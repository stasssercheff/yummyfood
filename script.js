document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById("orderForm");
  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popup-message");
  const totalBar = document.getElementById("total-kbju-bar");

  // ТЕКУЩИЙ ЯЗЫК
  const currentLang = document.documentElement.lang || "ru";

  // ФУНКЦИЯ ПЕРЕВОДА ПО КЛЮЧУ
  function t(key) {
    return window.i18n?.[key]?.[currentLang] || key;
  }

  // Функция подсчёта итогов
  function updateTotals() {
    let totalKbju = [0, 0, 0, 0];
    let totalPrice = 0;

    document.querySelectorAll('.dish').forEach(dish => {
      const qty = parseInt(dish.querySelector('select.qty')?.value) || 0;
      const price = parseInt(dish.querySelector('.price')?.dataset.price) || 0;
      const kbjuStr = dish.querySelector('.kbju')?.dataset.kbju;
      if (!kbjuStr || qty === 0) return;

      const kbju = kbjuStr.split('/').map(Number);
      for (let i = 0; i < 4; i++) totalKbju[i] += kbju[i] * qty;

      totalPrice += price * qty;
    });

    totalBar.textContent =
      `${t("total")} ${totalPrice.toLocaleString()}₫ — ${t("kbju")}: ${totalKbju.join('/')}`;
  }

  // Инициализация селекторов
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

  let popupShown = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const contactMethod = form.contactMethod.value.trim();
    const contactHandle = form.contactHandle.value.trim();
    const comment = form.comment.value.trim();

    if (!name || !contactMethod || !contactHandle) {
      alert(currentLang === "ru" ? "Заполните все контактные поля" : "Fill in all contact fields");
      return;
    }

    const orderItems = [];
    let kbjuTotal = [0, 0, 0, 0];
    let totalPrice = 0;

    document.querySelectorAll('.dish').forEach(dish => {
      const qty = parseInt(dish.querySelector('select.qty')?.value) || 0;
      const price = parseInt(dish.querySelector('.price')?.dataset.price) || 0;
      const kbjuStr = dish.querySelector('.kbju')?.dataset.kbju;
      if (!kbjuStr || qty === 0) return;

      const [k, b, j, u] = kbjuStr.split('/').map(Number);

      const dishName = dish.querySelector('.dish-name').textContent.trim();
      const portionWord = t("portions");

      orderItems.push(`${dishName} — ${qty} ${portionWord}`);

      kbjuTotal[0] += k * qty;
      kbjuTotal[1] += b * qty;
      kbjuTotal[2] += j * qty;
      kbjuTotal[3] += u * qty;

      totalPrice += price * qty;
    });

    if (orderItems.length === 0) {
      alert(currentLang === "ru" ? "Выберите хотя бы одно блюдо." : "Select at least one dish.");
      return;
    }

    const emailBody = `
Новый заказ от ${name}
Контакт: ${contactMethod} - ${contactHandle}
Комментарий: ${comment}

Заказ:
${orderItems.map((x, i) => `${i + 1}. ${x}`).join("\n")}

${t("total")} ${totalPrice.toLocaleString()}₫ — К/Б/Ж/У: ${kbjuTotal.join('/')}
    `;

    const orderHTML = `
      <ol style="margin:0; padding-left:18px; text-align:left;">
        ${orderItems.map(x => `<li>${x}</li>`).join("")}
      </ol>
      <br>
      <b>${t("total")}</b> ${totalPrice.toLocaleString()}₫ — К/Б/Ж/У: ${kbjuTotal.join("/")}
    `;

    // Попап
    if (!popupShown) {
      popupMessage.innerHTML = `
        <div style="font-family:Arial;font-size:12px;">
          <div><b>${name}</b>!</div>
          <div style="margin-top:6px;">${t("OrderSent")}</div>
          <div style="margin:14px 0 6px;">${t("YourOrder")}</div>
          ${orderHTML}
          <div style="margin-top:16px;">${t("ContactSoon")}</div>
        </div>
      `;
      popup.classList.remove("hidden");
      popupShown = true;
    }

    // Отправка на Web3Forms
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          access_key: "14d92358-9b7a-4e16-b2a7-35e9ed71de43",
          subject: "New Yummy Order",
          from_name: "Yummy Food Form",
          message: emailBody,
          reply_to: contactHandle,
          name: name
        })
      });
      const data = await res.json();
      if (!data.success)
        alert(currentLang === "ru" ? "Ошибка отправки формы." : "Form submission error.");
    } catch (err) {
      alert("Web3Forms error: " + err.message);
    }

    // Telegram
    try {
      await fetch("https://api.telegram.org/bot8472899454:AAGiebKRLt6VMei4toaiW11bR2tIACuSFeo/sendMessage", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          chat_id: 7408180116,
          text: emailBody
        })
      });
    } catch (err) {
      console.error("Telegram error:", err.message);
    }

    form.reset();
    updateTotals();
  });

  window.closePopup = function () {
    popup.classList.add("hidden");
    popupShown = false;
  };
});
