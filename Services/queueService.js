//queueService.js
import { ServiceBusClient } from "@azure/service-bus";

const connectionString = "Endpoint=sb://blooddonorsystem.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=10eMOIZyCOeqPKfNPFQOiLSsZjEwjOKOZ+ASbFdab8E=";
const queueName = "unfound-blood-requests";

// create a Service Bus client using the connection string to the Service Bus namespace
const sbClient = new ServiceBusClient(connectionString);

// createSender() can also be used to create a sender for a topic.
const retryOptions = {
  maxRetries: 5,
  delayInMs: 100,
};

const sender = sbClient.createSender(queueName, { retryOptions });
// const sender = sbClient.createSender(queueName);

// export async function queueBloodRequest(messages) {
//   try {
//     // create a batch object
//     let batch = await sender.createMessageBatch();

//     for (let i = 0; i < messages.length; i++) {
//       // for each message in the array

//       // create a ServiceBusMessage instance
//       const message = {
//         body: messages[i], // Assuming your messages are string payloads
//         // Add other message properties as needed
//       };

//       // try to add the message to the batch
//       if (!batch.tryAddMessage(message)) {
//         // if it fails to add the message to the current batch
//         // send the current batch as it is full
//         await sender.sendMessages(batch);

//         // then, create a new batch
//         batch = await sender.createMessageBatch();

//         // create a new ServiceBusMessage instance for the message
//         const newMessage = {
//           body: messages[i],
//           // Add other message properties as needed
//         };

//         // now, add the message failed to be added to the previous batch to this batch
//         if (!batch.tryAddMessage(newMessage)) {
//           // if it still can't be added to the batch, the message is probably too big to fit in a batch
//           throw new Error("Message too big to fit in a batch");
//         }
//       }
//     }

//     // Send the last created batch of messages to the queue
//     await sender.sendMessages(batch);

//     console.log(`Sent a batch of messages to the queue: ${queueName}`);
//   } finally {
//     await sender.close();
//     await sbClient.close();
//   }
// }

export async function queueBloodRequest(message) {
  try {
    // Connect to the Service Bus client
    const sbClient = new ServiceBusClient(connectionString);

    // Create a sender for the queue
    const sender = sbClient.createSender(queueName);

    // Create a batch object
    let batch = await sender.createMessageBatch();

    // Add the message to the batch
    if (!batch.tryAddMessage({ body: message })) {
      // If the message cannot fit in the current batch, send the current batch
      await sender.sendMessages(batch);

      // Create a new batch
      batch = await sender.createMessageBatch();

      // Try to add the message to the new batch
      if (!batch.tryAddMessage({ body: message })) {
        throw new Error("Message too big to fit in a batch");
      }
    }

    // Send the batch to the queue
    await sender.sendMessages(batch);

    // Close the sender and the client
    await sender.close();
    await sbClient.close();

    console.log(`Sent a message to the queue: ${queueName}`);
  } catch (error) {
    console.error('Error sending message to the queue:', error);
    throw error; // Rethrow the error to be handled in the calling function
  }
}

const fixUnquotedKeys = (jsonString) => {
  const fixedJsonString = jsonString.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');
  return fixedJsonString;
};

export async function getBloodRequestsInQueue() {
  const bloodRequests = [];
  const receiver = sbClient.createReceiver(queueName);

  try {
    // Receive messages from the queue
    const messages = await receiver.receiveMessages(10, {
      // Adjust the number of messages to receive as needed
    });
    await receiver.close();
    // Process received messages
    for (const message of messages) {
      //console.log("Received message:", message);
      try {
        const jsonString = message.body
    .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
    .replace(/'([^']+)'/g, '"$1"'); /* Turns this
    {
    "BloodRequestId": 2,
    "Hospital": 'Hospital', 
    "City": 'Adana', 
    "Town": 'Feke', 
    "BloodType": 'A+', 
    "Units": 2, 
    "ContactEmail": 'test@hotmail.com' 
    } 
    into this: 
    {
    "BloodRequestId": 2,
    "Hospital": "Hospital",
    "City": "Adana",
    "Town": "Feke",
    "BloodType": "A+",
    "Units": 2,
    "ContactEmail": "test@hotmail.com"
     } */
        // console.log("JSON String: ", jsonString);
        const bloodRequest = JSON.parse(jsonString);

        // console.log("Blood Request: ", bloodRequest);
        // console.log("Blood Request City: ", bloodRequest["City"]);
        if (!bloodRequest || !bloodRequest.City) {
          console.log(`Warning: Blood request ${message.body.BloodRequestId} has no 'City' property.`);
          continue; // Skip this iteration and move to the next message
        }

        //console.log("Blood Request: ", bloodRequest);
        // Add the blood request to the array
        bloodRequests.push(bloodRequest);

      } catch (parseError) {
        console.error('Error parsing JSON from message:', parseError);
      }
    }
  } catch (error) {
    console.error('Error getting blood requests from the queue:', error);
    throw error;
  } finally {
    await receiver.close();
  }

  return bloodRequests;
}