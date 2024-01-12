//scheduleService.js
import schedule from 'node-schedule';
import { getBloodBankCoordinates } from './geolocationService.js';
import { checkBloodRequestsProximity } from '../Services/geolocationService.js';

// Fetch blood bank coordinates dynamically
const bloodBankCoordinates = await getBloodBankCoordinates();

// Schedule the function to run every day at 1:00 AM
schedule.scheduleJob('0 0 1 * * *', async () => {
    await checkBloodRequestsProximity(bloodBankCoordinates);
  });

// Log a message when the schedule is initialized
console.log('Scheduled job initialized.');