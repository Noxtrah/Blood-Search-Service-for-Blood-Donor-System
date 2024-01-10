//scheduleService.js
const bloodBankCoordinates = { latitude: 40.123, longitude: 32.456 };

// Check proximity of blood requests in the queue to the blood bank
await checkBloodRequestsProximity(bloodBankCoordinates);