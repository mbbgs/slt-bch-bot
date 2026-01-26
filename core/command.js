import Group from '../models/group.js'
import Green from '../models/greenapi.js'
import { isDev, getRandomNaughty, MESSAGES, getHelp, loadClient } from '../helpers/utils.js'


export async function messageHandler(text = "", chatId = null, sender = null, quotedMessageId = null) {
  if (!text?.trim()) return;
  
  const client = loadClient();
  if (!client) {
    console.error('[FATAL] No client → message ignored');
    return;
  }
  
  const group = new Group(client, process.env.SPOTTFEHLER)
  
  const trimmed = text.trim();
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  
  switch (cmd) {
    case '^hun':
      if (!isDev(sender)) await client.sendMessage(chatId, 'You are not my hun 🌚😒')
      if (group != null) {
        await group.loadGroup().catch(err => console.error('[GROUP] Load failed:', err));
        await client.sendMessage(chatId, MESSAGES.HUN)
      }
      break
    case '^help':
      await client.replyMessage(chatId, quotedMessageId, getHelp());
      break;
      
    case '^checkup':
    case '^diag':
      if (!isDev(sender)) {
        await client.replyMessage(chatId, quotedMessageId, MESSAGES.NOT_DEV);
        return;
      }
      
      try {
        //const apiStatus = await client.checkConnection?.() ?? true;
        //const groupLoaded = !!group.groupMetadata;
        
        let statusMsg = MESSAGES.CHECKUP_OK;
        //statusMsg += `\n• GreenAPI: ${apiStatus ? 'ALIVE' : 'DEAD'}`;
        //statusMsg += `\n• Group cache: ${groupLoaded ? 'LOADED' : 'GHOST'}`;
        statusMsg += `\n• Uptime: ${(process.uptime() / 60).toFixed(1)} min`;
        statusMsg += `\n• Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`;
        
        await client.sendMessage(chatId, "```" + statusMsg + "```");
      } catch (err) {
        await client.sendMessage(chatId, "```" + MESSAGES.CHECKUP_FAIL + "\n" + err.message + "```");
      }
      break;
      
    case '^ta':
      if (!group.isAdmin(sender)) {
        await client.replyMessage(chatId, quotedMessageId, MESSAGES.NOT_ADMIN);
        return;
      }
      const tagMsg = parts.slice(1).join(' ') || "Jetzt ist der Fürher hier！📢";
      await client.tagAllMembers(chatId, tagMsg);
      break;
      
    case '^ssch': {
      if (!group.isAdmin(sender)) {
        await client.replyMessage(chatId, quotedMessageId, MESSAGES.NOT_ADMIN);
        return;
      }
      
      const args = trimmed.slice(cmd.length).trim();
      const match = args.match(/^(.+?)\s+(\d{1,2}:\d{2})\s*(.*)$/s);
      
      if (!match) {
        await client.sendMessage(chatId, 'Usage: ^ssch "Team Standup" 14:30 "Discord VC"');
        return;
      }
      
      const [, titleRaw, time, venueRaw] = match;
      const title = titleRaw.trim().replace(/^["']|["']$/g, '');
      const venue = venueRaw.trim().replace(/^["']|["']$/g, '');
      
      try {
        const result = await group.setReminder({ title, time, venue });
        await client.sendMessage(chatId, result.message || "Schedule locked in 🗓️");
      } catch (err) {
        await client.sendMessage(chatId, `Schedule write failed: ${err.message}`);
      }
      break;
    }
    
    case '^gsch':
      try {
        const filter = parts[1]?.toLowerCase() === 'a' ? 'all' : 'today';
        const tasks = await group.remainder(filter);
        
        if (!tasks?.length) {
          await client.sendMessage(chatId, filter === 'all' ?
            "Zero schedules in the database rn 🫥" :
            "Nothing cooking today, nigga")
          return;
        }
        
        let msg = "```SCHEDULE DROP:\n\n";
        tasks.forEach(t => {
          msg += `→ ${t.title} @ ${t.time}`;
          if (t.venue) msg += ` (${t.venue})`;
          msg += "\n";
        });
        msg += "```";
        
        await client.sendMessage(chatId, msg);
      } catch (err) {
        await client.sendMessage(chatId, "```Failed to fetch schedules. RIP db```");
      }
      break;
      
    default:
      if (Math.random() > 0.3) {
        const reply = getRandomNaughty();
        await client.sendMessage(chatId, reply);
      } else {
        await client.sendMessage(chatId, "Command not found bruv, try ^help");
      }
      break;
  }
}