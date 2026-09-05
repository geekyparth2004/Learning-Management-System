const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query('DELETE FROM "Job"')
    .then(r => {
        console.log('Deleted', r.rowCount, 'old mock jobs');
        pool.end();
    })
    .catch(e => {
        console.error(e);
        pool.end();
        process.exit(1);
    });
