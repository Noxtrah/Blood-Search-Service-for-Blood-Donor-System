//timerFunction.js
import { dequeueMessages, processRequest, deleteMessage } from './queueService'; // Update with your actual module path


export default async function timerTrigger(context, myTimer) {
  try {
    // Dequeue messages and process them
    const messages = await dequeueMessages();
    for (const message of messages) {
      const request = JSON.parse(message.messageText);
      await processRequest(request);
      await deleteMessage(message.messageId, message.popReceipt);
    }

    context.log('Function executed successfully.');
  } catch (error) {
    context.log.error('Error during function execution:', error);
  }
}