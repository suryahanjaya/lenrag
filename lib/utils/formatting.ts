/**
 * Text Formatting Utilities
 * Extracted from dashboard.tsx to reduce code duplication
 */

/**
 * Format AI response with better paragraph structure
 * Converts bullet points to flowing text and creates proper paragraphs
 */
export const formatAIResponse = (content: string): string => {
    // First, try to split by existing paragraph breaks
    let paragraphs = content.split('\n\n').map(p => p.trim()).filter(p => p.length > 0);

    // If no paragraph breaks exist, try to create them based on sentence patterns
    if (paragraphs.length === 1 && paragraphs[0].length > 200) {
        const text = paragraphs[0];

        // Split by sentences that end with periods followed by capital letters
        const sentences = text.split(/(?<=\.)\s+(?=[A-Z])/);

        // Group sentences into paragraphs (3-4 sentences per paragraph)
        const newParagraphs = [];
        let currentParagraph = [];

        for (let i = 0; i < sentences.length; i++) {
            currentParagraph.push(sentences[i]);

            // Create new paragraph every 3-4 sentences or at key phrases
            if (currentParagraph.length >= 3 ||
                sentences[i].includes('Selain itu') ||
                sentences[i].includes('Dalam') ||
                sentences[i].includes('Atas') ||
                sentences[i].includes('Sumber:') ||
                sentences[i].includes('Pembukaan') ||
                sentences[i].includes('Perjuangan') ||
                sentences[i].includes('Atas berkat') ||
                sentences[i].includes('Dan perjuangan') ||
                sentences[i].includes('Maka disusunlah') ||
                sentences[i].includes('Undang-Undang Dasar')) {
                newParagraphs.push(currentParagraph.join(' '));
                currentParagraph = [];
            }
        }

        // Add remaining sentences
        if (currentParagraph.length > 0) {
            newParagraphs.push(currentParagraph.join(' '));
        }

        paragraphs = newParagraphs;
    }

    // Enhanced formatting for DORA responses - remove bullet points and create flowing paragraphs
    let formatted = paragraphs.map(paragraph => {
        // Remove bullet points and numbering completely, convert to flowing text
        let cleaned = paragraph
            .replace(/^[\s]*[•\-\*]\s*/gm, '') // Remove bullet points
            .replace(/^\s*\d+\.\s*/gm, '') // Remove numbering
            .replace(/^\s*[-•*]\s*/gm, '') // Remove any remaining bullet-like characters
            .trim();

        // If the paragraph was originally a list, convert it to flowing text
        if (paragraph.includes('•') || paragraph.includes('-') || paragraph.includes('*') || /^\d+\./.test(paragraph)) {
            const lines = paragraph.split('\n').filter(line => line.trim());
            const cleanedLines = lines.map(line => {
                return line
                    .replace(/^[\s]*[•\-\*]\s*/, '')
                    .replace(/^\s*\d+\.\s*/, '')
                    .trim();
            }).filter(line => line.length > 0);

            // Join with appropriate connectors
            if (cleanedLines.length > 1) {
                cleaned = cleanedLines.join('. ') + '.';
            } else {
                cleaned = cleanedLines[0] || cleaned;
            }
        }

        // Ensure proper sentence structure
        if (cleaned && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
            cleaned += '.';
        }

        return cleaned;
    }).filter(p => p.length > 0).join('\n\n');

    // Add proper spacing and formatting
    formatted = formatted
        .replace(/\n\n+/g, '\n\n') // Remove excessive line breaks
        .replace(/^\s+|\s+$/g, ''); // Trim whitespace

    return formatted;
};

/**
 * Detect if AI response appears incomplete
 */
export const detectIncompleteResponse = (content: string): boolean => {
    const incompleteIndicators = [
        'kurang lengkap',
        'tidak lengkap',
        'sebagian',
        'beberapa',
        'sebagian besar',
        'umumnya'
    ];

    const hasIncompleteIndicator = incompleteIndicators.some(indicator =>
        content.toLowerCase().includes(indicator)
    );

    return hasIncompleteIndicator;
};

/**
 * Get question suggestions for incomplete responses
 */
export const getQuestionSuggestions = (content: string): string[] => {
    const suggestions = [];

    if (content.includes('Pembukaan UUD') || content.includes('UUD 1945')) {
        suggestions.push(
            "Coba tanyakan: 'Berikan pembukaan UUD 1945 secara lengkap dan utuh'",
            "Atau: 'Tuliskan seluruh isi pembukaan UUD 1945 tanpa pengurangan'",
            "Atau: 'Sebutkan pembukaan UUD 1945 dari awal sampai akhir'"
        );
    }

    if (content.includes('pasal') || content.includes('Pasal')) {
        suggestions.push(
            "Coba tanyakan: 'Berikan penjelasan lengkap tentang pasal tersebut'",
            "Atau: 'Jelaskan secara detail isi pasal yang dimaksud'"
        );
    }

    return suggestions;
};

/**
 * Format date to localized string (mobile optimized)
 */
export const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);

    // Use shorter format for mobile: DD/MM/YY, HH:MM
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    }) + ', ' + date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};
