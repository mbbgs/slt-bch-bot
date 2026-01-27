import Green from '../models/greenapi.js'



const MESSAGES = {
  HELP: "Bruv just type ^help and chill, no need for essays",
  NOT_ADMIN: "Lmao nice try, you're not admin fam 🚫",
  NOT_DEV: "Access denied. This command is dev-only, go touch grass normie",
  CHECKUP_OK: "SYSTEM STATUS: Nominal AF 🔥\nBot online | GreenAPI connected | Group cache loaded",
  CHECKUP_FAIL: "CRITICAL: Something exploded 💀 Check logs",
  HUN: "HEY BABE 🙈"
};

function loadClient() {
  try {
    const client = new Green(
      process.env.ID_INSTANCE,
      process.env.API_TOKEN_INSTANCE
    );
    console.log('[INIT] GreenAPI client spawned successfully');
    return client;
  } catch (err) {
    console.error('[CRASH] Failed to summon GreenAPI client:', err);
    return null;
  }
}

function getHelp() {
  return `
  ╔════════════════════════════╗
  ║   SLT BOTv1.337 | ^prefix  ║
  ║     BCH OPTION CREW 2025   ║
  ╚════════════════════════════╝

  Available commands:
  • ^help                → this menu, obviously
  • ^ta [msg?]           → tag all (admin only)
  • ^vet @user           → vet someone (admin)
  • ^ssch "Title" HH:MM "Venue?" → drop a schedule (admin)
  • ^gsch [t|a]          → view today's / all schedules
  • ^sttable ...         → course timetable (WIP) N/A
  • ^boot @user          → yeet user (admin)
  
  Dev-only:
  • ^checkup | ^diag     → system health probe (you only)
  `;
}


function isDev(sender) {
  const DEV_NUMBER = process.env.DEV_PHONE || '2347042507852@c.us';
  return sender === DEV_NUMBER;
}


const NAUGHTY_EGGS = [
  { message: "Invalid input. But your mom's inbox last night? Validated multiple times 🍑💦" },
  { message: "Nice try. Now go practice your fingering… on the keyboard first" },
  { message: "That's not a valid command… but damn, keep talking dirty to me like that 👀" },
  { message: "Bro typed garbage & expected magic? Touch some grass… or touch yourself, I don't judge 😏" },
];

function getRandomNaughty() {
  const randomIndex = Math.floor(Math.random() * NAUGHTY_EGGS.length);
  return NAUGHTY_EGGS[randomIndex].message;
}

export {
  isDev,
  getHelp,
  MESSAGES,
  loadClient,
  getRandomNaughty
}