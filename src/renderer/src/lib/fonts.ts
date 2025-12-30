// Amiri Regular Font (Subset for common Arabic chars to keep size manageable)
// Ideally we should load this from a file, but for a single file solution in browser context, Base64 is reliable.
// This is a placeholder for the actual Base64 string of a font like Amiri or Cairo.
// Due to character limit, I will use a shorter version or instructions.
// REAL IMPLEMENTATION: We need a full font. I will provide a method to load it from Google Fonts CDN or local assets.

export const amiriFont = "AAEAAAARAQAABAAQRkZUTW....."; // Too long to include here directly in chat response comfortably.

// Better approach: Let's use the addFont method with a URL or local file if possible, 
// OR simpler: Use a library that handles this or inject the font.

// Let's try adding the font from a CDN url in the PDF generator if environment allows, 
// or better: I will add a function to fetch the font buffer.

