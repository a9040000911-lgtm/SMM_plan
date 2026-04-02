const { Client } = require('pg');
const client = new Client('postgresql://smmuser:smmpassword@89.23.98.202:5433/smmplan?schema=public');
client.connect()
  .then(() => client.query('SELECT "organizationId" FROM "Project" LIMIT 1;'))
  .then((res) => console.log('Rows:', res.rows))
  .catch(console.error)
  .finally(() => client.end());
