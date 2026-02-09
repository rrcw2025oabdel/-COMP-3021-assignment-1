import * as readline from 'readline';
import * as mysql from 'mysql';
import { exec } from 'child_process';
import * as https from 'https';


// replacng the hard-coded credentials with environment variables and safer defaults
const dbConfig = {
    host: process.env.DB_HOST || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    ssl: { rejectUnauthorized: true }, // enforce TLS cert validation
    multipleStatements: false          // mitigate stacked query injection
};


// validating/sanitized user input before it is used anywhere else
function getUserInput(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question('Enter your name: ', (answer) => {
            rl.close();
            const sanitized = answer.trim();

            // Allow letters, numbers, spaces, apostrophes, and hyphens. Max length 100.
            if (!/^[\p{L}\p{N}\s'-]{1,100}$/u.test(sanitized)) {
                console.error('Invalid input provided.');
                resolve(''); // or reject/reprompt depending on UX requirements
                return;
            }

            resolve(sanitized);
        });
    });
}



// replacing shell-based exec with spawn and validate inputs
function sendEmail(to: string, subject: string, body: string) {
    const { spawn } = require('child_process');

    // Basic email validation and subject length limiting
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
        console.error('Invalid recipient email address.');
        return;
    }
    const safeSubject = String(subject || '').slice(0, 200);

    // Using spawn to avoid shell injection; pass args separately
    const mail = spawn('mail', ['-s', safeSubject, to], { shell: false });

    mail.stdin.write(String(body ?? ''));
    mail.stdin.end();

    mail.on('error', (error: Error) => {
        console.error(`Error sending email: ${error}`);
    });
}



// using HTTPS with basic hardening containing status checks and timeouts
function getData(): Promise<string> {
    return new Promise((resolve, reject) => {
        const https = require('https');
        const req = https.get('https://insecure-api.com/get-data', (res: any) => {
            if (res.statusCode && res.statusCode >= 400) {
                reject(new Error(`HTTP error ${res.statusCode}`));
                return;
            }
            let data = '';
            res.on('data', (chunk: Buffer) => (data += chunk.toString()));
            res.on('end', () => resolve(data));
        });

        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy(new Error('Request timed out'));
        });
    });
}



// using parameterized queries and constrain input size
function saveToDb(data: string) {
    const connection = mysql.createConnection({ ...dbConfig, multipleStatements: false });

    const safeData = String(data ?? '').slice(0, 10000);

    const query = 'INSERT INTO mytable (column1, column2) VALUES (?, ?)';
    connection.connect((connErr) => {
        if (connErr) {
            console.error('Error connecting to DB:', connErr);
            return;
        }

        connection.query(query, [safeData, 'Another Value'], (error, results) => {
            if (error) {
                console.error('Error executing query:', error);
            } else {
                console.log('Data saved');
            }
            connection.end();
        });
    });
}


(async () => {
    const userInput = await getUserInput();
    const data = await getData();
    saveToDb(data);
    sendEmail('admin@example.com', 'User Input', userInput);

})();
