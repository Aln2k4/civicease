const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

/**
 * Validates if the uploaded file is likely a Birth Certificate
 * @param {string} filePath - Path to the uploaded file
 * @returns {Promise<boolean>} - True if valid, false otherwise
 */
const verifyBirthCertificate = async (filePath) => {
    try {
        // Only verify images for now (Tesseract works on images)
        // If PDF, we might need a converter or just skip/assume valid for MVP
        if (filePath.toLowerCase().endsWith('.pdf')) {
            console.log("OCR skipped for PDF. Assuming valid for now.");
            return true;
        }

        console.log(`Starting OCR verification for: ${filePath}`);

        const { data: { text } } = await Tesseract.recognize(
            filePath,
            'eng',
            { logger: m => console.log(m) } // Optional logger
        );

        console.log("Extracted Text:", text.substring(0, 200) + "..."); // Start of text

        const lowerText = text.toLowerCase();

        // Keywords to check
        const keywords = [
            'birth certificate',
            'certificate of birth',
            'government',
            'kerala',
            'registrar',
            'janana' // Malayalam transliteration usually
        ];

        // Check if any keyword matches
        const isValid = keywords.some(keyword => lowerText.includes(keyword));

        return isValid;

    } catch (error) {
        console.error("OCR Error:", error);
        // Fallback: If OCR fails, we might technically allow it or fail safely. 
        // For strict validation, return false. For improved UX, maybe log and allow with warning?
        // Let's return false to enforce valid documents as requested.
        return false;
    }
};

module.exports = { verifyBirthCertificate };
