export function messageHandler(text = "", group) {
  const trimmed = text.trim();
  if (!trimmed) return;
  
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  
  switch (cmd) {
    case '^set':
    case '^schedule':
    case '^add':
      
      // expect: !set "Team Meeting" 14:30 "Discuss Q1 targets" "Conference Room A"
      // Very basic parsing – in real bot use better arg parser
      const title = parts[1]?.replace(/^["']|["']$/g, '');
      const time = parts[2];
      const ven = parts.slice(3).join(' ').replace(/^["']|["']$/g, '') || '';
      
      if (!title || !time) {
        // reply "Usage: !set \"Title\" HH:MM \"description\""
        return;
      }
      
      group.setReminder({ title, time, venue: ven }).then(result => {
        // send result.message to group chat
      });
      break;
      
    case '!upcoming':
    case '!reminders':
      group.remainder().then(tasks => {
        if (tasks.length === 0) {
          // send "No upcoming events today"
        } else {
          // format nice list
        }
      });
      break;
      
    default:
      // unknown command
  }
}