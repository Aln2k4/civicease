const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'Kerala_Villages_Usernames.csv');
const newFile = path.join(__dirname, 'usernames.csv');

try {
    const file1Raw = fs.readFileSync(targetFile, 'utf-8');
    const file2Raw = fs.readFileSync(newFile, 'utf-8');

    const outputLines = ['Sl. No.,Taluk,Village Name,Username,Password'];
    const seenUsernames = new Set();
    let slNo = 1;

    // Parse file 1 (Kerala_Villages_Usernames.csv)
    const lines1 = file1Raw.split('\n');
    for (let line of lines1) {
        line = line.trim();
        if (!line) continue;
        if (line.startsWith('Sl. No')) continue;

        // Stop at the first sign of binary junk (we saw  or PK in the corrupted end)
        if (line.includes('') || line.includes('PK') || line.includes('xl/')) break;

        const parts = line.split(',');
        if (parts.length >= 5) {
            const taluk = parts[1];
            const village = parts[2];
            const username = parts[3];
            const password = parts[4];

            if (!seenUsernames.has(username)) {
                seenUsernames.add(username);
                outputLines.push(`${slNo++},${taluk},${village},${username},${password}`);
            }
        }
    }

    // Parse file 2 (usernames.csv)
    // Structure: Sl. No.,District,Taluk,Village Name,Username,Password
    const lines2 = file2Raw.split('\n');
    for (let line of lines2) {
        line = line.trim();
        if (!line) continue;
        if (line.startsWith('Sl. No')) continue;

        const parts = line.split(',');
        if (parts.length >= 6) {
            const taluk = parts[2];
            const village = parts[3];
            const username = parts[4];
            const password = parts[5];

            if (!seenUsernames.has(username)) {
                seenUsernames.add(username);
                outputLines.push(`${slNo++},${taluk},${village},${username},${password}`);
            }
        }
    }

    fs.writeFileSync(targetFile, outputLines.join('\n'));
    console.log(`Successfully merged files!`);
    console.log(`Total unique villages/usernames: ${seenUsernames.size}`);

} catch (e) {
    console.error('Error merging CSVs:', e);
}
