const slides = Array.from(document.querySelectorAll(".slide"));
const title = document.querySelector("#slide-title");
const slideCount = document.querySelector("#slide-count");
const previousButton = document.querySelector("#prev-slide");
const nextButton = document.querySelector("#next-slide");
const triggerList = document.querySelector("#trigger-list");

const triggers = [
  ["Feedback intake", "Owner note, bug report, user feedback, agent observation, or security concern."],
  ["Triage", "New insights/issues, after intake, after QA, or when no work is actionable."],
  ["Prioritization", "Multiple possible next items, stale backlog, or changed evidence."],
  ["Dev loop", "Implement anything, do the next task, or fix a confirmed issue."],
  ["Deep research", "A task needs research first, or research is requested directly."],
  ["Security review", "Storage, imports, dependencies, user input, browser permissions, or data-loss risk."],
  ["Code review", "Every work item before it ships."],
  ["Git workflow", "Reviewed and verified work is ready to commit and push."],
  ["QA/product review", "Epic done, about five shipped tasks, on demand, or sensitive slice shipped."],
  ["Knowledge maintenance", "After QA, raw notes, owner research, no actionable work, or about ten shipped tasks."],
  ["Artifact creation", "A human-facing rendered output, presentation, report, export, or document is requested."]
];

let currentSlide = 0;

function renderTriggers() {
  triggerList.innerHTML = triggers
    .map(([process, trigger]) => {
      return `<article class="trigger-card"><strong>${process}</strong><span>${trigger}</span></article>`;
    })
    .join("");
}

function showSlide(index) {
  currentSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === currentSlide);
  });

  title.textContent = slides[currentSlide].dataset.title;
  slideCount.textContent = `${currentSlide + 1} / ${slides.length}`;
}

previousButton.addEventListener("click", () => showSlide(currentSlide - 1));
nextButton.addEventListener("click", () => showSlide(currentSlide + 1));

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    showSlide(currentSlide - 1);
  }

  if (event.key === "ArrowRight" || event.key === " ") {
    event.preventDefault();
    showSlide(currentSlide + 1);
  }
});

renderTriggers();
showSlide(0);

