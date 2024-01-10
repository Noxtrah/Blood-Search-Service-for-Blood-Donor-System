// geolocationService.js
import fetch from 'node-fetch';
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
    console.log('Data:', data);
    const city = data.data.find((c) => c.name.toLowerCase() === cityName.toLowerCase());

    if (city) {
      const coordinates = city.coordinates;
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

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_KM * c;

  return distance;
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

// Function to check if blood requests in the queue are close to the blood bank
export async function checkBloodRequestsProximity(bloodBankCoordinates) {
    try {
      // Fetch blood requests that are already in the queue
      const bloodRequestsInQueue = await getBloodRequestsInQueue();
  
      // Iterate over blood requests in the queue and perform distance calculation
      for (const queuedRequest of bloodRequestsInQueue) {
        const requestedCity = queuedRequest.City;
        const requestedCityCoordinates = await getCoordinatesByCity(requestedCity);
  
        // Calculate distance
        const distance = calculateDistance(requestedCityCoordinates, bloodBankCoordinates);
  
        // Check if the blood bank is within 50km
        if (distance <= 50) {
          // Do something with the blood bank or the queued request
          console.log(`Blood bank is within 50km of ${requestedCity}`);
        }
      }
    } catch (error) {
      console.error('Error checking blood requests proximity:', error);
      throw error;
    }
  }