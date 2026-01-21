// webhook-server.js
import express from 'express';
import { GreenApi } from '@green-api/whatsapp-api-client-js-v2';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const client = new GreenApi({
  idInstance: process.env.ID_INSTANCE, // e.g. 1101xxxx@1
  apiTokenInstance: process.env.API_TOKEN_INSTANCE,
});

// -------------------------------
//    YOUR WEBHOOK ENDPOINT
// -------------------------------


app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    console.log('← Webhook received:', JSON.stringify(body, null, 2));
    
    const type = body?.typeWebhook;
    
    if (type === 'incomingMessageReceived') {
      const sender = body.senderData?.sender; // e.g. 234xxxxxxxxxx@c.us
      const text = body.messageData?.textMessageData?.textMessage;
      
      console.log(`Message from ${sender}: ${text}`);
      
      // Optional: auto-reply example
      if (text?.toLowerCase().includes('hello')) {
        await client.sendMessage(sender, 'Hi there! How can I help? 😊');
      }
    }
    
    else if (type === 'outgoingMessageStatus') {
      console.log('Message status update:', body);
      // e.g. sent, delivered, read, failed
    }
    
    else if (type === 'stateInstanceChanged') {
      console.log('Instance state changed:', body.stateInstance);
    }
    
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(200);
  }
});


app.get('/health', (req, res) => res.send('Webhook server is alive 🚀'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});