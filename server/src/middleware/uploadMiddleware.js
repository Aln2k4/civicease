const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const certDir = 'uploads/certificates';
const stagingDir = 'uploads/staging';

[certDir, stagingDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Determine destination based on file type or fieldname
        if (file.mimetype.includes('csv') || file.originalname.endsWith('.csv')) {
            cb(null, stagingDir);
        } else {
            cb(null, certDir);
        }
    },
    filename: (req, file, cb) => {
        // Unique filename: fieldname-timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (Images, PDFs, and CSVs)
const fileFilter = (req, file, cb) => {
    console.log("[Multer] Processing file:", file.originalname, "Mimetype:", file.mimetype);

    const allowedTypes = /jpeg|jpg|png|pdf|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    // Mime types for CSV can vary (text/csv, application/csv, application/vnd.ms-excel, etc.)
    // We'll trust the extension more for CSVs or check loosely.
    // Simplifying regex for mimetype to include common CSV types
    const mimeTypeRegex = /jpeg|jpg|png|pdf|csv|excel|spreadsheet|text/;
    const mimetype = mimeTypeRegex.test(file.mimetype);

    console.log("[Multer] Ext check:", extname, "Mime check:", mimetype);

    // Relaxed check: Trust extension for CSVs as Windows often sends application/vnd.ms-excel or empty
    if (extname && (mimetype || file.originalname.toLowerCase().endsWith('.csv'))) {
        cb(null, true);
    } else {
        console.error("[Multer] File rejected!");
        cb(new Error('Only images (jpg, jpeg, png), PDFs, and CSVs are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

module.exports = upload;
