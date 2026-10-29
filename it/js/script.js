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

setupFaq();
setupMissingImages();
setupYear();
