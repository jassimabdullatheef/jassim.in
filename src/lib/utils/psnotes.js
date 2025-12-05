/**
 * Process HTML content to convert PS notes to styled HTML
 * Looks for paragraphs starting with "PS:" or "P.S.:" and wraps them
 * 
 * @param {string} html - HTML content (after markdown conversion)
 * @returns {string} - HTML with PS notes wrapped in special containers
 */
export function preprocessPSNotes(html) {
  // Pattern to match paragraphs starting with PS: or P.S.:
  // This handles both <p>PS: ...</p> and <p>P.S.: ...</p>
  // The pattern captures the entire paragraph content after PS:/P.S.:
  const psPattern = /<p>(PS|P\.S\.):\s*(.+?)<\/p>/gis;
  
  return html.replace(psPattern, (match, prefix, text) => {
    // Preserve the text content (may contain HTML from markdown like <em>, <strong>, etc.)
    const psText = text.trim();
    
    return `<div class="ps-note">
  <div class="ps-label">P.S.</div>
  <div class="ps-content">${psText}</div>
</div>`;
  });
}
