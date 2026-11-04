/* MELNRAKSTS. Pieteikuma forma statiskai lapai.
 * FORM_ENDPOINT: ielieciet formu servisa adresi (piem. Web3Forms "https://api.web3forms.com/submit"
 * vai Formspree "https://formspree.io/f/XXXX"). Kamēr tukšs, forma atver e-pastu (mailto) uz FALLBACK_EMAIL.
 * Web3Forms gadījumā aizpildiet arī WEB3FORMS_ACCESS_KEY (tā ir publiska atslēga, nav parole). */
const FORM_ENDPOINT = "";            // TODO: formu servisa URL (nav izvēlēts / nav reģistrēts)
const WEB3FORMS_ACCESS_KEY = "";     // TODO: tikai ja izmanto Web3Forms
const FALLBACK_EMAIL = "info@pieskirts.lv";

(function () {
  const form = document.getElementById("order-form");
  if (!form) return;
  const status = document.getElementById("form-status");
  const T = (k) => (form.dataset[k] || "");

  function buildMailto(fd) {
    const labels = {name:"Vārds, uzvārds", company:"Uzņēmums", regno:"Reģ. nr.", email:"E-pasts", phone:"Tālrunis",
      service:"Pakalpojums", link:"Saite / apraksts", deadline:"Termiņš", message:"Ziņa"};
    let body = "";
    for (const k in labels) { const v = (fd.get(k) || "").toString().trim(); if (v) body += labels[k] + ": " + v + "\n"; }
    body += "\nPiekrītu datu apstrādei saskaņā ar privātuma politiku: jā\n";
    const subj = T("subject") + " — " + (fd.get("company") || fd.get("name") || "");
    return "mailto:" + FALLBACK_EMAIL + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const fd = new FormData(form);
    if ((fd.get("website") || "") !== "") return; // honeypot
    fd.delete("website");
    if (!FORM_ENDPOINT) {
      status.className = "status ok"; status.textContent = T("mailtoMsg");
      window.location.href = buildMailto(fd);
      return;
    }
    if (WEB3FORMS_ACCESS_KEY) { fd.append("access_key", WEB3FORMS_ACCESS_KEY); fd.append("subject", T("subject")); }
    status.className = "status"; status.textContent = T("sendingMsg");
    try {
      const r = await fetch(FORM_ENDPOINT, { method: "POST", body: fd, headers: { "Accept": "application/json" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      form.reset();
      status.className = "status ok"; status.textContent = T("okMsg");
    } catch (err) {
      status.className = "status err"; status.textContent = T("errMsg");
      window.location.href = buildMailto(fd);
    }
  });
})();
