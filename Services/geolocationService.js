// geolocationService.js
import fetch from 'node-fetch';
import { connectToDatabase, getPool } from '../db.js';
import { sendEmail } from './mailService.js';
import sql from 'mssql';
import { getBloodRequestsInQueue } from './queueService.js';

const GEOLOCATION_API_URL = 'https://turkiyeapi.dev/api/v1/provinces';
const EARTH_RADIUS_KM = 6371;

export async function getCoordinatesByCity(cityName) {
  try {
    const response = await fetch(GEOLOCATION_API_URL);
    const data = await response.json();

    if (!data || !data.data || data.data.length === 0) {
      throw new Error('Invalid or empty data received from the API');
    }
    // console.log('City Name:', cityName);
    const city = data.data.find((c) => c.name && c.name.toLowerCase() === cityName.toLowerCase());

    if (city) {
      // console.log('City Object:', city);
      const { latitude, longitude } = city.coordinates;
      const coordinates = [latitude, longitude];
      // console.log('Coordinates:', coordinates);
      return coordinates;
    }

    throw new Error(`Coordinates not found for city: ${cityName}`);
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    throw error;
  }
}

export function calculateDistance(coord1, coord2) {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;

//   console.log('Input Coordinates:', coord1, coord2);
//   console.log('lat1, lon1:', lat1, lon1);
// console.log('lat2, lon2:', lat2, lon2);

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // console.log('dLat:', dLat);
  // console.log('dLon:', dLon);
  // console.log('a:', a);
  // console.log('c:', c);

  const distance = EARTH_RADIUS_KM * c;

  return distance;
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

// Function to check if blood requests in the queue are close to the blood bank
export async function checkBloodRequestsProximity() {
    try {
       // Fetch blood bank coordinates dynamically
        const bloodBankCoordinates = await getBloodBankCoordinates();

        if (!bloodBankCoordinates) {
          console.log('Blood bank coordinates not available.');
          return;
        }
      // Fetch blood requests that are already in the queue
      const bloodRequestsInQueue = await getBloodRequestsInQueue();
      console.log('Blood requests in queue:', bloodRequestsInQueue);

      // Iterate over blood requests in the queue and perform distance calculation
      for (const queuedRequest of bloodRequestsInQueue) {
        // Check if the message has the 'City' property
        if (!queuedRequest.City) {
          console.log(`Warning: Blood request ${queuedRequest.BloodRequestId} has no 'City' property.`);
          continue; // Skip this iteration and move to the next message
      }
        const requestedCity = queuedRequest.City;
        console.log("Requested City:", requestedCity);
        const requestedCityCoordinates = await getCoordinatesByCity(requestedCity);
        console.log('Requested City Coordinates:', requestedCityCoordinates);
        console.log('Blood Bank Coordinates:', bloodBankCoordinates);

        // Calculate distance
        for (const bloodBankCoord of bloodBankCoordinates) {
          console.log("BloodBankCoord: ", bloodBankCoord);

          const distance = calculateDistance(requestedCityCoordinates, bloodBankCoord);

          console.log('Distance:', distance);
          // Check if the blood bank is within 50km
          if (distance <= 50) {
            const emailOptions = {
              to: queuedRequest.ContactEmail, // Replace with the actual property that contains the email
              subject: 'Blood Bank Proximity Alert',
              body: `Blood bank is within 50km of ${requestedCity}`,
            };
            // Send the email
            console.log("Email send to: ", emailOptions);
            await sendEmail(emailOptions.to, requestedCity);
            // console.log(`Blood bank is within 50km of ${requestedCity}`);
          }
        }
      }
    } catch (error) {
      console.error('Error checking blood requests proximity:', error);
      throw error;
    }
  }

  export async function getBloodBankCoordinates() {
    try {
      // Fetch blood bank coordinates dynamically
      const bloodBankData = await fetchBloodBankData();
      // console.log("Blood bank data: ", bloodBankData);
  
      if (!bloodBankData || bloodBankData.length === 0) {
        console.log('Blood bank data not available.');
        return null;
      }
  
      // Extract coordinates from blood bank data
      const bloodBankCoordinates = bloodBankData.map(location => [
        location.latitude,
        location.longitude,
      ]);
      // console.log('Blood bank coordinates:', bloodBankCoordinates);
      return bloodBankCoordinates;
    } catch (error) {
      console.error('Error getting blood bank coordinates:', error);
      throw error;
    }
  }

  export async function fetchBloodBankData() {
    try {
      // Ensure the database connection is established
      await connectToDatabase();
  
      // Replace these lines with your actual database query logic
      const result = await getPool().request().query('SELECT City FROM Donor');
      const bloodBankData = result.recordset; // Assuming you expect one record

      // console.log('Blood bank data:', bloodBankData);
  
      if (!bloodBankData || bloodBankData.length === 0) {
        console.log('Blood bank data not found.');
        return null;
      }
  
       // Fetch coordinates for each city
    const bloodBankCoordinates = [];
    for (const record of bloodBankData) {
      // console.log('Record Object:', record);
      const city = record.City;
      const coordinates = await getCoordinatesByCity(city);
      // console.log("Coordinates in fetchBloodBankData: ", coordinates);
      if (coordinates) {
        bloodBankCoordinates.push({
          city,
          latitude: coordinates[0],
          longitude: coordinates[1],
        });
      } else {
        console.log(`Coordinates not found for city: ${city}`);
      }
    }
    console.log("Blood bank coordinates in fetchBloodBankData: ", bloodBankCoordinates)
    return bloodBankCoordinates;
    } catch (error) {
      console.error('Error fetching blood bank data:', error);
      throw error;
    }
  }