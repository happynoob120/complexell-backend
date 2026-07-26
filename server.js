require('dotenv').config()

const app = require('./src/app')
const connectDB = require('./src/db/db')
const dns = require('node:dns/promises');
dns.setServers(["1.1.1.1", "8.8.8.8"]); 

connectDB()

app.listen(process.env.PORT, () => {
    console.log(`Server successfully started at http://localhost:${process.env.PORT}`);
});