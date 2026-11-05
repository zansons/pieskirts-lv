/* Pieteikuma forma → Web3Forms (https://api.web3forms.com/submit).
 * Ja Web3Forms neatbild, rāda kļūdu un mailto saiti uz FALLBACK_EMAIL. */
const FALLBACK_EMAIL = "info@pieskirts.lv";
const FORM_ENDPOINT = "https://api.web3forms.com/submit";
const W3F_ACCESS_KEY = "009d43c1-ed5f-4152-947e-ed27e5c118a8";

(function () {
  const form = document.getElementById("order-form");
  if (!form) return;
  const status = document.getElementById("form-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const T = (k) => (form.dataset[k] || "");
  // Mailto body labels by page language (<html lang>): lv (default), en, ru.
  const LANGS = {
    lv: {labels: {name:"Vārds, uzvārds", company:"Uzņēmums", regno:"Reģ. nr.", email:"E-pasts", phone:"Tālrunis",
      service:"Pakalpojums", link:"Saite / apraksts", deadline:"Termiņš", message:"Ziņa"},
      consent: "Piekrītu datu apstrādei saskaņā ar privātuma politiku: jā",
      fallbackPrefix: "vai rakstiet uz "},
    en: {labels: {name:"Full name", company:"Company", regno:"Reg. no.", email:"Email", phone:"Phone",
      service:"Service", link:"Link / description", deadline:"Deadline", message:"Message"},
      consent: "I agree to data processing under the privacy policy: yes",
      fallbackPrefix: "or write to "},
    ru: {labels: {name:"Имя, фамилия", company:"Компания", regno:"Рег. номер", email:"E-mail", phone:"Телефон",
      service:"Услуга", link:"Ссылка / описание", deadline:"Срок", message:"Сообщение"},
      consent: "Согласен(-на) на обработку данных согласно политике конфиденциальности: да",
      fallbackPrefix: "или напишите на "}
  };
  const lang = (document.documentElement.lang || "lv").slice(0, 2).toLowerCase();
  const L = LANGS[lang] || LANGS.lv;

  function buildMailto(fd) {
    const labels = L.labels;
    let body = "";
    for (const k in labels) { const v = (fd.get(k) || "").toString().trim(); if (v) body += labels[k] + ": " + v + "\n"; }
    body += "\n" + L.consent + "\n";
    const subj = T("subject") + " — " + (fd.get("company") || fd.get("name") || "");
    return "mailto:" + FALLBACK_EMAIL + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
  }

  function showError(fd) {
    const href = buildMailto(fd);
    status.className = "status err";
    status.textContent = "";
    status.appendChild(document.createTextNode(T("errMsg") + " "));
    const a = document.createElement("a");
    a.href = href;
    a.textContent = L.fallbackPrefix + FALLBACK_EMAIL;
    status.appendChild(a);
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const fd = new FormData(form);
    if ((fd.get("website") || "") !== "") return; // local honeypot
    fd.delete("website");

    const company = (fd.get("company") || fd.get("name") || "").toString().trim();
    const visitorEmail = (fd.get("email") || "").toString().trim();
    const payload = {
      name: (fd.get("name") || "").toString().trim(),
      company: (fd.get("company") || "").toString().trim(),
      regno: (fd.get("regno") || "").toString().trim(),
      email: visitorEmail,
      phone: (fd.get("phone") || "").toString().trim(),
      service: (fd.get("service") || "").toString().trim(),
      link: (fd.get("link") || "").toString().trim(),
      deadline: (fd.get("deadline") || "").toString().trim(),
      message: (fd.get("message") || "").toString().trim(),
      consent: (fd.get("consent") || "").toString().trim(),
      access_key: W3F_ACCESS_KEY,
      subject: T("subject") + " — " + company,
      from_name: (company || "Vietnes pieteikums"),
      replyto: visitorEmail,
      botcheck: ""
    };

    status.className = "status";
    status.textContent = T("sendingMsg");
    if (submitBtn) submitBtn.disabled = true;

    try {
      const r = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });
      let data = null;
      try { data = await r.json(); } catch (_) { /* non-JSON */ }
      if (!r.ok || (data && data.success === "false") || (data && data.success === false)) {
        throw new Error((data && (data.message || data.error)) || ("HTTP " + r.status));
      }
      form.reset();
      status.className = "status ok";
      status.textContent = T("okMsg");
    } catch (err) {
      showError(fd);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();
