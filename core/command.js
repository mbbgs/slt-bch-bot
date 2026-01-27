import { isDev, getRandomNaughty, MESSAGES, getHelp, loadClient } from '../helpers/utils.js'
import Group from '../models/group.js'


const approvedGroups = new Set();



export async function messageHandler(text = "", chatId = null, sender = null, quotedMessageId = null) {
  if (!text?.trim()) return;
  
  const client = loadClient();
  if (!client) {
    console.error('[FATAL] No client, ignoring message');
    return;
  }
  
  const group = new Group(client, process.env.SPOTTFEHLER || '2347042507852@c.us');
  
  // Dev commands always allowed, even in unapproved groups
  const cmdParts = text.trim().split(/\s+/);
  const cmd = cmdParts[0].toLowerCase();
  const isDevCommand = ['^checkup', '^diag', '^approve', '^hun'].includes(cmd);
  
  // Block non-approved groups (except dev cmds)
  if (!isDevCommand && !approvedGroups.has(chatId)) {
    if (Math.random() > 0.5) {
      await client.sendMessage(chatId, "Group not approved yet... behave or beg hun 😏");
    } else {
      await client.sendMessage(chatId, "Not talking here until approved. Dev only.");
    }
    return;
  }
  
  // Load group metadata fresh every time (cheap call, no file needed)
  try {
    await group.loadGroup();
  } catch (err) {
    console.error('[GROUP LOAD ERROR]', err.message);
  }
  
  switch (cmd) {
    case '^hun':
      if (!isDev(sender)) {
        await client.sendMessage(chatId, 'You are not my hun 🌚😒');
        return;
      }
      await client.sendMessage(chatId, MESSAGES.HUN || 'Group metadata refreshed, master 🫡');
      break;
      
    case '^approve':
      if (!isDev(sender)) {
        await client.sendMessage(chatId, 'Only hun can approve groups 🌚');
        return;
      }
      const target = cmdParts[1] || chatId;
      approvedGroups.add(target);
      await client.sendMessage(chatId, `Group ${target} approved 🔥 Now I can misbehave here.`);
      break;
      
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
        let statusMsg = MESSAGES.CHECKUP_OK || 'SYSTEM STATUS: We still breathing 🔥';
        statusMsg += `\n• Uptime: ${(process.uptime() / 60).toFixed(1)} min`;
        statusMsg += `\n• Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`;
        statusMsg += `\n• Approved groups: ${approvedGroups.size}`;
        await client.sendMessage(chatId, "```" + statusMsg + "```");
      } catch (err) {
        await client.sendMessage(chatId, "```Something died inside\n" + err.message + "```");
      }
      break;
      
    case '^ta':
      if (!group.isAdmin(sender)) {
        await client.replyMessage(chatId, quotedMessageId, MESSAGES.NOT_ADMIN);
        return;
      }
      const tagMsg = cmdParts.slice(1).join(' ') || "Alle hierher, jetzt! 📢";
      await client.tagAllMembers(chatId, tagMsg);
      break;
      
    case '^ssch': {
      if (!group.isAdmin(sender)) {
        await client.replyMessage(chatId, quotedMessageId, MESSAGES.NOT_ADMIN);
        return;
      }
      
      const args = text.slice(cmd.length).trim();
      const match = args.match(/^(.+?)\s+(\d{1,2}:\d{2})\s*(.*)$/s);
      
      if (!match) {
        await client.sendMessage(chatId, 'Usage: ^ssch "Title" 14:30 "Venue optional"');
        return;
      }
      
      const [, titleRaw, time, venueRaw] = match;
      const title = titleRaw.trim().replace(/^["']|["']$/g, '');
      const venue = venueRaw.trim().replace(/^["']|["']$/g, '');
      
      try {
        const result = await group.setReminder({ title, time, venue });
        await client.sendMessage(chatId, result.message || "Locked in 🗓️");
      } catch (err) {
        await client.sendMessage(chatId, `Failed: ${err.message}`);
      }
      break;
    }
    
    case '^gsch':
      try {
        const filter = cmdParts[1]?.toLowerCase() === 'a' ? 'all' : 'today';
        const tasks = await group.remainder(filter);
        
        if (!tasks?.length) {
          await client.sendMessage(chatId, filter === 'all' ?
            "Nothing in memory at all 🫥" :
            "No plans today, king");
          return;
        }
        
        let msg = "```SCHEDULES IN MEMORY:\n\n";
        tasks.forEach(t => {
          msg += `→ ${t.title} @ ${t.time}`;
          if (t.venue) msg += ` (${t.venue})`;
          msg += "\n";
        });
        msg += "```";
        
        await client.sendMessage(chatId, msg);
      } catch (err) {
        await client.sendMessage(chatId, "```Brain fart fetching schedules```");
      }
      break;
      
    case '^sttable':
      await client.sendMessage(chatId, `sttable me harder ${sender} 🤭`)
      break;
      
    default:
      if (Math.random() > 0.3) {
        await client.sendMessage(chatId, getRandomNaughty());
      } else {
        await client.sendMessage(chatId, "Unknown command bruv, ^help exists for a reason");
      }
      break;
  }
}