// dbConfig.js
const dbConfig = {
    user: 'Noxtra',
    password: 'BloodDonorApp3',
    server: 'blood-donor-app.database.windows.net',
    database: 'BloodDonorDatabase',
    options: {
      encrypt: true, // For Azure SQL Database, set to true
    },
  };

export {dbConfig};