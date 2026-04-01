const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const url = process.env.DATABASE_URL;
const adminUrl = url.replace(/\/smmplan\?/, '/postgres?');

console.log('Connecting to postgres admin DB...');

const client = new Client({ connectionString: adminUrl });

client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL!');
    return client.query("SELECT 1 FROM pg_database WHERE datname = 'smmplan_test'");
  })
  .then((res) => {
    if (res.rowCount === 0) {
      console.log('Creating database smmplan_test...');
      return client.query('CREATE DATABASE smmplan_test').then(() => {
        console.log('SUCCESS: Database smmplan_test created!');
      });
    } else {
      console.log('Database smmplan_test already exists.');
    }
  })
  .then(() => client.end())
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('ERROR:', err.message);
    client.end().catch(() => {});
    process.exit(1);
  });
