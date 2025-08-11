/**
 * Utility functions for processing HTML content in messages
 */

/**
 * Extracts readable text from HTML content
 * @param htmlContent - The HTML content to process
 * @returns Clean text content without HTML tags
 */
export function extractTextFromHTML(htmlContent: string): string {
	if (!htmlContent || typeof htmlContent !== "string") {
		return htmlContent || "";
	}

	// Remove HTML tags but preserve line breaks
	let text = htmlContent
		// Remove entire <style> blocks (including CSS content)
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
		// Remove entire <script> blocks
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
		// Remove <head> blocks (meta tags, etc.)
		.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
		// Remove <!DOCTYPE> declarations
		.replace(/<!DOCTYPE[^>]*>/gi, "")
		// Remove HTML comments
		.replace(/<!--[\s\S]*?-->/g, "\n")
		// Replace common HTML entities
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		// Handle UTF-8 encoded characters (Portuguese and other special characters)
		.replace(/&aacute;/g, "á")
		.replace(/&agrave;/g, "à")
		.replace(/&atilde;/g, "ã")
		.replace(/&acirc;/g, "â")
		.replace(/&eacute;/g, "é")
		.replace(/&egrave;/g, "è")
		.replace(/&ecirc;/g, "ê")
		.replace(/&iacute;/g, "í")
		.replace(/&igrave;/g, "ì")
		.replace(/&ocirc;/g, "ô")
		.replace(/&otilde;/g, "õ")
		.replace(/&ograve;/g, "ò")
		.replace(/&uacute;/g, "ú")
		.replace(/&ugrave;/g, "ù")
		.replace(/&ccedil;/g, "ç")
		.replace(/&Aacute;/g, "Á")
		.replace(/&Agrave;/g, "À")
		.replace(/&Atilde;/g, "Ã")
		.replace(/&Acirc;/g, "Â")
		.replace(/&Eacute;/g, "É")
		.replace(/&Egrave;/g, "È")
		.replace(/&Ecirc;/g, "Ê")
		.replace(/&Iacute;/g, "Í")
		.replace(/&Igrave;/g, "Ì")
		.replace(/&Ocirc;/g, "Ô")
		.replace(/&Otilde;/g, "Õ")
		.replace(/&Ograve;/g, "Ò")
		.replace(/&Uacute;/g, "Ú")
		.replace(/&Ugrave;/g, "Ù")
		.replace(/&Ccedil;/g, "Ç")
		// Replace <br>, <p>, <div> with line breaks
		.replace(/<br\s*\/?>/gi, "\n\n")
		.replace(/<\/p>/gi, "\n")
		.replace(/<\/div>/gi, "\n\n")
		.replace(/<\/td>/gi, "\n")
		.replace(/<\/tr>/gi, "\n")
		.replace(/<\/table>/gi, "\n")
		// Remove all remaining HTML tags
		.replace(/<[^>]*>/g, "")
		// Clean up multiple line breaks and excessive whitespace
		.replace(/\n\s*\n/g, "\n\n")
		.replace(/\n{3,}/g, "\n\n")
		// Remove excessive whitespace at the beginning of lines
		.replace(/^\s+/gm, "")
		// Trim whitespace
		.trim();

	return text;
}

/**
 * Decodes UTF-8 encoded text that may have been corrupted during processing
 * @param text - The potentially corrupted text
 * @returns Properly decoded UTF-8 text
 */
export function decodeUTF8Text(text: string): string {
	if (!text || typeof text !== "string") {
		return text || "";
	}

	let decodedText = text;

	// Fix common UTF-8 corruption patterns for Portuguese characters
	decodedText = decodedText
		.replace(/Ã£/g, "ã")
		.replace(/Ã¡/g, "á")
		.replace(/Ã /g, "à")
		.replace(/Ã¢/g, "â")
		.replace(/Ã©/g, "é")
		.replace(/Ã¨/g, "è")
		.replace(/Ãª/g, "ê")
		.replace(/Ã­/g, "í")
		.replace(/Ã¬/g, "ì")
		.replace(/Ã³/g, "ó")
		.replace(/Ã²/g, "ò")
		.replace(/Ã´/g, "ô")
		.replace(/Ãµ/g, "õ")
		.replace(/Ãº/g, "ú")
		.replace(/Ã¹/g, "ù")
		.replace(/Ã§/g, "ç")
		.replace(/Ãƒ/g, "Ã")
		.replace(/Ã/g, "Á")
		.replace(/Ã€/g, "À")
		.replace(/Ã‚/g, "Â")
		.replace(/Ã‰/g, "É")
		.replace(/Ãˆ/g, "È")
		.replace(/ÃŠ/g, "Ê")
		.replace(/Ã/g, "Í")
		.replace(/ÃŒ/g, "Ì")
		.replace(/Ã"/g, "Ó")
		.replace(/Ã/g, "Ò")
		.replace(/Ã"/g, "Ô")
		.replace(/Ã•/g, "Õ")
		.replace(/Ãš/g, "Ú")
		.replace(/Ã™/g, "Ù")
		.replace(/Ã‡/g, "Ç");

	return decodedText;
}

/**
 * Checks if content contains HTML
 * @param content - The content to check
 * @returns True if content contains HTML tags
 */
export function containsHTML(content: string): boolean {
	if (!content || typeof content !== "string") {
		return false;
	}

	// Simple check for HTML tags
	return /<[^>]*>/.test(content);
}

/**
 * Truncates HTML content for preview
 * @param htmlContent - The HTML content to truncate
 * @param maxLength - Maximum length for preview
 * @returns Truncated text content
 */
export function truncateHTMLContent(
	htmlContent: string,
	maxLength: number = 100
): string {
	const text = extractTextFromHTML(htmlContent);

	if (text.length <= maxLength) {
		return text;
	}

	return text.substring(0, maxLength) + "...";
}

/**
 * Extracts email subject from HTML content (if present)
 * @param htmlContent - The HTML content to analyze
 * @returns Email subject or null if not found
 */
export function extractEmailSubject(htmlContent: string): string | null {
	if (!htmlContent || typeof htmlContent !== "string") {
		return null;
	}

	// Look for common email subject patterns
	const subjectMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
	if (subjectMatch) {
		return subjectMatch[1].trim();
	}

	// Look for subject in meta tags
	const metaSubjectMatch = htmlContent.match(
		/<meta[^>]*name=["']subject["'][^>]*content=["']([^"']+)["']/i
	);
	if (metaSubjectMatch) {
		return metaSubjectMatch[1].trim();
	}

	return null;
}

/**
 * Determines if content is an email (HTML with email-like structure)
 * @param content - The content to analyze
 * @returns True if content appears to be an email
 */
export function isEmailContent(content: string): boolean {
	if (!content || typeof content !== "string") {
		return false;
	}

	// Check for email-like HTML structure
	const emailIndicators = [
		/<!DOCTYPE html/i,
		/<html[^>]*>/i,
		/<head[^>]*>/i,
		/<body[^>]*>/i,
		/mailto:/i,
		/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i, // Email addresses
		/calendly\.com/i,
		/outlook\.com/i,
		/gmail\.com/i,
	];

	return emailIndicators.some((indicator) => indicator.test(content));
}
