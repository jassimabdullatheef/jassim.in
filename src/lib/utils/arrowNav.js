// Svelte action: lets ArrowLeft/ArrowRight move focus between a group of
// sibling clickable items (marked with [data-nav-item]) instead of only
// supporting Tab. Only steers focus when it's already inside the group.
/**
 * @param {HTMLElement} node
 */
export function arrowNav(node) {
  /** @param {KeyboardEvent} e */
  function handleKeydown(e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

    const items = Array.from(node.querySelectorAll("[data-nav-item]"));
    if (!items.length) return;

    const active = document.activeElement;
    const idx = items.indexOf(/** @type {any} */ (active));
    if (idx === -1) return;

    e.preventDefault();
    e.stopPropagation();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (idx + dir + items.length) % items.length;
    /** @type {HTMLElement} */ (items[next]).focus();
  }

  node.addEventListener("keydown", handleKeydown);

  return {
    destroy() {
      node.removeEventListener("keydown", handleKeydown);
    },
  };
}
