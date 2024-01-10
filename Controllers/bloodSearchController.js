// bloodSearchController.js
import { BloodSearchRequest } from '../Models/bloodSearchModel.js';
import { queueBloodRequest } from '../Services/queueService.js';
import { connectToDatabase, getPool } from '../db.js';
import { ServiceBusClient } from "@azure/service-bus";
import sql from 'mssql';
import fetch from 'node-fetch';
import { inspect } from 'util';

const searchRequestsQueue = [];
const processedRequests = new Set();

export async function purgeQueue(req, res) {
  const connectionString = "Endpoint=sb://blooddonorsystem.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=10eMOIZyCOeqPKfNPFQOiLSsZjEwjOKOZ+ASbFdab8E=";
  const queueName = "unfound-blood-requests";
  try {
    const sbClient = new ServiceBusClient(connectionString);
    const receiver = sbClient.createReceiver(queueName);

    let message = await receiver.receiveMessages(1);

    while (message.length > 0) {
      // Process the message or simply complete it to remove from the queue
      await receiver.completeMessage(message[0]);

      // Receive the next message
      message = await receiver.receiveMessages(1);
    }

    // Close the receiver and the client
    await receiver.close();
    await sbClient.close();

    console.log(`Purged the queue: ${queueName}`);

    res.status(200).json({ message: 'Queue purged successfully' });
  } catch (error) {
    console.error('Error purging the queue:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function searchBlood(req, res) {
  try {
    // Fetch blood requests from the specified URL
    const bloodRequestsResponse = await fetch('https://clientserviceblooddonorsystem.azurewebsites.net/api/blood-request-list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    // console.log(bloodRequestsResponse);
    if (!bloodRequestsResponse.ok) {
      // Handle the case where fetching blood requests failed
      return res.status(500).json({ error: 'Failed to fetch blood requests' });
    }

    // Parse the JSON response
    const bloodRequestsData = await bloodRequestsResponse.json();

    // Connect to the database
    await connectToDatabase();
    const detailedMatches = [];

    // Loop through all blood requests
    for (const request of bloodRequestsData.bloodRequests) {
      const requestedBloodType = request.BloodType;
      const requestedUnits = request.Units;
      const requestId = request.BloodRequestId;

      if (processedRequests.has(requestId)) {
        continue; // Skip sending a message for this request
      }

      // Query available matching blood from the blood bank using the current request values
      const queryResult = await getPool()
        .request()
        .input('requestedBloodType', sql.VarChar, requestedBloodType)
        .input('requestedUnits', sql.Int, requestedUnits)
        .query(`
          SELECT *
          FROM BloodBank
          WHERE BloodType = @requestedBloodType
            AND Units >= @requestedUnits
        `);

      // Get the matching blood data
      const matchingBlood = queryResult.recordset;

      // Store the details of the current request and its matches
      detailedMatches.push({
        request,
        matches: matchingBlood,
      });

      if (!matchingBlood.length) { // If there is unmatched bloodRequest, put it in the queue
        const stringifiableRequest = inspect(request, { depth: null, breakLength: Infinity });
        await queueBloodRequest(stringifiableRequest);
  
        // Mark the request as processed
        processedRequests.add(requestId);
      }
    }

    res.status(200).json({ detailedMatches });

  } catch (error) {
    console.error('Error retrieving matching blood from the database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}