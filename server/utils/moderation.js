/**
 * Professional moderation utility for filtering harmful content.
 * Filters harmful, immoral, threatening, and offensive language.
 */

const forbiddenWords = [
    // Threatening / Violent
    "kill", "shoot", "bomb", "threat", "attack", "murder", "harm", "dead",
    "violence", "weapon", "gun", "knife", "terror", "explode",

    // Immoral / Offensive (Common slur patterns - keeping it professional)
    "porn", "sex", "rape", "abuse", "molest", "victim",
    "hate", "racist", "suicide", "ugly", "stupid", "dumb",

    // Profanity (Generic placeholders for common harmful words)
    "f*ck", "sh*t", "b*tch", "a**hole", "d*ck",

    // User Requested Restrictions
    "control", "modify", "correct"
];

const forbiddenPatterns = [
    /\b[f|F][u|U|*][c|C|*][k|K|*]\b/,
    /\b[s|S][h|H|*][i|I|*][t|T|*]\b/,
    /\b[b|B][i|I|*][t|T|*][c|C|*][h|H|*]\b/,
    /\b[a|A][s|S|*][s|S|*]\b/
];

/**
 * Checks if a string contains any harmful or restricted words.
 * @param {string} text The text to validate
 * @returns {boolean} True if harmful content is detected
 */
export const containsHarmfulWords = (text) => {
    if (!text || typeof text !== "string") return false;
    console.log(`[MODERATION] Checking text: "${text}"`);
    const lowerText = text.toLowerCase();

    // Check against individual words
    for (const word of forbiddenWords) {
        if (lowerText.includes(word.toLowerCase())) {
            return true;
        }
    }

    // Check against patterns
    for (const pattern of forbiddenPatterns) {
        if (pattern.test(text)) {
            return true;
        }
    }

    return false;
};
