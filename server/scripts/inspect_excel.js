const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../..', 'Kerala_Villages_Usernames.xlsx');

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Assume first sheet
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON to see structure
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // Header: 1 gives array of arrays

    console.log('--- Headers ---');
    console.log(data[0]);

    console.log('\n--- First 3 Rows ---');
    console.log(data.slice(1, 4));

} catch (error) {
    console.error('Error reading Excel file:', error.message);
}
