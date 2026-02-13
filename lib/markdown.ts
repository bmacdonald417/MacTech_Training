/**
 * Simple markdown-to-HTML for static content (resources, terms, etc.).
 * Handles # ## ###, **bold**, and paragraphs.
 */
export function markdownToHtml(content: string): string {
  return content
    .replace(/^### (.*)$/gim, "<h3 class='text-lg font-semibold mt-6 mb-2'>$1</h3>")
    .replace(/^## (.*)$/gim, "<h2 class='text-xl font-semibold mt-8 mb-2'>$1</h2>")
    .replace(/^# (.*)$/gim, "<h1 class='text-2xl font-bold mt-4 mb-4'>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\n\n/gim, "</p><p class='mb-4'>")
    .replace(/\n/gim, "<br />")
}
