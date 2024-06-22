const mysql = require("mysql2/promise");
const db = {
    host: '81.31.247.100',
    port: 3306,
    user: 'GnORID',
    password: 'cZiVurJltBSfDnZz',
    database: 'testdatabase' // Replace with your database name
};
async function connectToDatabase() {
    const connection = await mysql.createConnection(db);
    return connection;
}
module.exports = connectToDatabase
