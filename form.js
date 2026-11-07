/* Pieteikuma forma -> Web3Forms (https://api.web3forms.com/submit).
 * Panākumu rāda tikai tad, ja Web3Forms atbild ar success: true.
 * Citādi rāda kļūdu un mailto saiti uz FALLBACK_EMAIL; ievadītie dati paliek formā. */
const FALLBACK_EMAIL = "info@pieskirts.lv";
const FORM_ENDPOINT = "https://api.web3forms.com/submit";
const W3F_ACCESS_KEY = "009d43c1-ed5f-4152-947e-ed27e5c118a8";
const TIMEOUT_MS = 15000;

(function () {
  const form = document.getElementById("order-form");
  if (!form) return;
  const status = document.getElementById("form-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const T = (k) => (form.dataset[k] || "");
  const LANGS = {
    lv: {labels: {name:"Vārds, uzvārds", company:"Uzņēmums", regno:"Reģ. nr.", email:"E-pasts", phone:"Tālrunis",
      service:"Pakalpojums", link:"Saite / apraksts", deadline:"Termiņš", message:"Ziņa"},
      consent: "Esmu iepazinies ar privātuma politiku: jā",
      fallbackPrefix: "Vai rakstiet uz "},
    en: {labels: {name:"Full name", company:"Company", regno:"Reg. no.", email:"Email", phone:"Phone",
      service:"Service", link:"Link / description", deadline:"Deadline", message:"Message"},
      consent: "I have read the privacy policy: yes",
      fallbackPrefix: "Or write to "},
    ru: {labels: {name:"Имя, фамилия", company:"Компания", regno:"Рег. номер", email:"E-mail", phone:"Телефон",
      service:"Услуга", link:"Ссылка / описание", deadline:"Срок", message:"Сообщение"},
      consent: "Я ознакомился(-ась) с политикой конфиденциальности: да",
      fallbackPrefix: "Или напишите на "}
  };
  const lang = (document.documentElement.lang || "lv").slice(0, 2).toLowerCase();
  const L = LANGS[lang] || LANGS.lv;
  const val = (fd, k) => (fd.get(k) || "").toString().trim();

  function buildMailto(fd) {
    let body = "";
    for (const k in L.labels) { const v = val(fd, k); if (v) body += L.labels[k] + ": " + v + "\n"; }
    body += "\n" + L.consent + "\n";
    const subj = T("subject") + " - " + (val(fd, "company") || val(fd, "name"));
    return "mailto:" + FALLBACK_EMAIL + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
  }

  function showError(fd) {
    status.className = "status err";
    status.textContent = "";
    status.appendChild(document.createTextNode(T("errMsg") + " "));
    const a = document.createElement("a");
    a.href = buildMailto(fd);
    a.textContent = L.fallbackPrefix + FALLBACK_EMAIL;
    status.appendChild(a);
  }

  let sending = false;
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (sending) return;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const fd = new FormData(form);
    // Honeypots: a filled hidden field or a ticked hidden botcheck means a bot. Pretend nothing happened.
    if (val(fd, "website") !== "" || fd.get("botcheck")) return;

    const company = val(fd, "company") || val(fd, "name");
    const payload = {
      access_key: W3F_ACCESS_KEY,
      subject: T("subject") + " - " + company,
      from_name: company || "Vietnes pieteikums",
      replyto: val(fd, "email"),
      name: val(fd, "name"), company: val(fd, "company"), regno: val(fd, "regno"),
      email: val(fd, "email"), phone: val(fd, "phone"), service: val(fd, "service"),
      link: val(fd, "link"), deadline: val(fd, "deadline"), message: val(fd, "message"),
      consent: val(fd, "consent"),
      page_language: lang
    };

    sending = true;
    status.className = "status";
    status.textContent = T("sendingMsg");
    if (submitBtn) { submitBtn.disabled = true; submitBtn.setAttribute("aria-busy", "true"); }
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;

    try {
      const r = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl ? ctrl.signal : undefined
      });
      let data = null;
      try { data = await r.json(); } catch (_) { data = null; }
      if (!r.ok || !data || data.success !== true) throw new Error("not confirmed");
      form.reset();
      status.className = "status ok";
      status.textContent = T("okMsg");
    } catch (err) {
      showError(fd);
    } finally {
      if (timer) clearTimeout(timer);
      sending = false;
      if (submitBtn) { submitBtn.disabled = false; submitBtn.removeAttribute("aria-busy"); }
    }
  });
})();
