"use strict";

function setupFaq() {
  document.querySelectorAll(".faq-question").forEach((button) => {
    button.setAttribute("aria-expanded", String(button.closest(".faq-item").classList.contains("active")));

    button.addEventListener("click", () => {
      const currentItem = button.closest(".faq-item");

      document.querySelectorAll(".faq-item").forEach((item) => {
        const isCurrent = item === currentItem;
        const shouldOpen = isCurrent && !item.classList.contains("active");
        item.classList.toggle("active", shouldOpen);
        item.querySelector(".faq-question")?.setAttribute("aria-expanded", String(shouldOpen));
      });
    });
  });
}

function setupMissingImages() {
  document.querySelectorAll(".image-shell img").forEach((image) => {
    const markMissing = () => image.closest(".image-shell")?.classList.add("is-missing");
    image.addEventListener("error", markMissing);
    if (image.complete && image.naturalWidth === 0) markMissing();
  });
}

function setupYear() {
  document.querySelectorAll(".js-year").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
}

const META_CONFIG = Object.freeze({
  pixelId: "2328916111389472",
  capiEndpoint: "https://jonyai-n8n-webhook.c9hj2a.easypanel.host/webhook/pixel",
  trackingStorageKey: "manualcriativo_meta_tracking_id"
});

let metaPixelReady = false;
let generatedFbc = null;

function createEventId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getTrackingId() {
  try {
    const currentId = window.localStorage.getItem(META_CONFIG.trackingStorageKey);
    if (currentId) return currentId;

    const newId = createEventId();
    window.localStorage.setItem(META_CONFIG.trackingStorageKey, newId);
    return newId;
  } catch (_) {
    return createEventId();
  }
}

function getCookie(name) {
  const prefix = `${name}=`;
  const item = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

function getFbc() {
  const cookieValue = getCookie("_fbc");
  if (cookieValue) return cookieValue;

  if (generatedFbc) return generatedFbc;

  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  if (!fbclid) return null;

  generatedFbc = `fb.1.${Date.now()}.${fbclid}`;

  try {
    document.cookie = `_fbc=${encodeURIComponent(generatedFbc)}; Max-Age=7776000; Path=/; SameSite=Lax; Secure`;
  } catch (_) {}

  return generatedFbc;
}

function sendCapiEvent(eventName, eventId, customData) {
  if (!/^https:\/\//i.test(META_CONFIG.capiEndpoint)) return;

  const userData = {
    fbc: getFbc(),
    fbp: getCookie("_fbp")
  };

  Object.keys(userData).forEach((key) => {
    if (!userData[key]) delete userData[key];
  });

  const payload = {
    tracking_id: getTrackingId(),
    event_name: eventName,
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: window.location.href,
    action_source: "website",
    user_agent: navigator.userAgent,
    user_data: userData,
    custom_data: customData
  };

  const formBody = new URLSearchParams({ payload: JSON.stringify(payload) });

  fetch(META_CONFIG.capiEndpoint, {
    method: "POST",
    body: formBody,
    mode: "no-cors",
    keepalive: true,
    credentials: "omit"
  }).catch(() => {});
}

function trackMetaEvent(eventName, customData = {}) {
  if (!metaPixelReady || typeof window.fbq !== "function") return;

  const eventId = createEventId();
  window.fbq("track", eventName, customData, { eventID: eventId });
  window.setTimeout(() => sendCapiEvent(eventName, eventId, customData), 350);
}

function loadMetaPixel() {
  if (metaPixelReady) return;

  if (typeof window.fbq !== "function") {
    (function(f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function() { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  }

  window.fbq("init", META_CONFIG.pixelId);
  metaPixelReady = true;
  trackMetaEvent("PageView");
}

function setupMetaTracking() {
  loadMetaPixel();

  document.querySelectorAll("[data-meta-checkout]").forEach((link) => {
    try {
      const checkoutUrl = new URL(link.href);
      checkoutUrl.searchParams.set("sck", getTrackingId());
      link.href = checkoutUrl.toString();
    } catch (_) {}

    link.addEventListener("click", () => {
      trackMetaEvent("InitiateCheckout", {
        content_name: link.dataset.metaCheckout,
        content_type: "product",
        currency: "EUR",
        value: Number(link.dataset.metaValue)
      });
    });
  });
}

setupFaq();
setupMissingImages();
setupYear();
setupMetaTracking();
