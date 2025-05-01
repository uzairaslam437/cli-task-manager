const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
}) ;

const initDb = async () => {
    const client = await pool.connect();

    try{
        await client.query(`
            CREATE TABLE IF NOT EXISTS tasks(
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                due_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`
        );
        console.log(`Database initialized successfully!`)
    }
    catch(err){
        console.error(`ERROR: Initailizing database.`)
    }
    finally{
        client.release();
    }

}

module.exports = {initDb,pool};
