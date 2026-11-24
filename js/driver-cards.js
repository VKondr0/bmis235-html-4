document.querySelectorAll(".showcase .f1-card").forEach((card) => {
    card.addEventListener("click", () => {
        const flipped = card.classList.toggle("is-flipped");
        card.setAttribute("aria-pressed", String(flipped));
    });
});
