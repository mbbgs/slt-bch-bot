import express from 'express';
import { isGreenApi } from './middlewares/mh.js'
import { messageHandler } from './core/command.js';

const app = express();
app.use(express.json());


// -------------------------------
//    GREEN-API WEBHOOK ENDPOINT
// -------------------------------

app.use(isGreenApi(process.env.WEBHOOK_SECRET)())


app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    console.log('← Webhook received:', JSON.stringify(body, null, 2));
    
    const type = body?.typeWebhook;
    
    if (type === 'incomingMessageReceived') {
      const messageData = body?.messageData;
      const senderData = body?.senderData;
      
      if (!messageData || !senderData) {
        console.log('Incomplete incoming message — ignoring');
        return res.sendStatus(200);
      }
      
      const sender = senderData.sender;
      const chatId = senderData.chatId || sender;
      
      // Handle only text messages for now
      let text = null;
      let quotedMessageId = null;
      
      if (messageData.typeMessage === 'textMessage') {
        text = messageData.textMessageData?.textMessage;
      } else if (messageData.typeMessage === 'extendedTextMessage') {
        // quoted / forwarded / long text
        text = messageData.extendedTextMessageData?.text;
        quotedMessageId = messageData.extendedTextMessageData?.quotedMessage?.idMessage;
      }
      
      if (!text?.trim()) {
        console.log('No text content in message — skipping');
        return res.sendStatus(200);
      }
      
      console.log(`Processing message from ${sender} in \( {chatId}: " \){text}"`);
      
      // Forward to your command handler
      await messageHandler(
        text,
        chatId,
        sender,
        quotedMessageId
      );
    }
    
    else if (type === 'outgoingMessageStatus') {
      console.log('Outgoing status:', body?.status, body?.idMessage);
    }
    
    else if (type === 'stateInstanceChanged') {
      console.log('Instance state →', body?.stateInstance);
    }
    
    else {
      console.log('Unhandled webhook type:', type);
    }
    
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook handler crashed:', err.message);
    res.sendStatus(200);
  }
});



app.get('/ndu', (req, res) => {
  res.send('Webhook server is alive 🚀');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening → http://localhost:${PORT}`);
  console.log('Ready for Green-API events on /webhook');
});