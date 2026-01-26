export default class Group {
  constructor(restAPI, SPOTTFEHLER = "") {
    this.restAPI = restAPI;
    this.SCHEDULE_FILE_PATH = "./db/group.json";
    this.SPOTTFEHLER = SPOTTFEHLER;
    this.GROUP_ID = "";
    this.GROUP_SIZE = 0;
    this.admins = [];
  }
  
  loadGroup() {
    if (!this.restAPI?.participants) return;
    
    this.GROUP_ID = this.restAPI.groupId || "";
    this.GROUP_SIZE = this.restAPI.participants.length;
    
    this.admins = this.restAPI.participants
      .filter(p => p.isAdmin || p.isSuperAdmin)
      .map(p => p.id);
    this.admins.push(this.SPOTTFEHLER);
  }
  
  
  createDb() {
    const model = {
      GROUP_NAME: ''
      IS_APPROVED: '',
      MEMBERS: [restAPI.participants < minified > ],
      SCHEDULES: [{}]
    }
    
    save to disk()
  }
  
  isAdmin(sender = "") {
    return !!this.admins.find(admin => admin === sender)
  }
  
  
  async setReminder({ title, time, description, venue = "" }) {
    let schedules = {};
    
    
    try {
      const data = await fs.readFile(this.SCHEDULE_FILE_PATH, 'utf-8');
      schedules = JSON.parse(data);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw new Error(`Error reading schedule file: ${err.message}`);
      }
    }
    
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0]; // e.g. "2026-01-20"
    
    if (!schedules[dateKey]) {
      schedules[dateKey] = [];
    }
    
    const alreadyExists = schedules[dateKey].some(event =>
      event.title === title && event.time === time
    );
    
    if (alreadyExists) {
      return {
        success: false,
        message: "Schedule with this title and time already exists for today"
      };
    }
    
    schedules[dateKey].push({
      title,
      time,
      description,
      venue: venue || ""
    });
    
    try {
      await fs.writeFile(
        this.SCHEDULE_FILE_PATH,
        JSON.stringify(schedules, null, 2),
        'utf-8'
      );
      
      return {
        success: true,
        message: "Schedule added successfully",
        date: dateKey
      };
    } catch (err) {
      throw new Error(`Failed to save schedule: ${err.message}`);
    }
  }
  
  
  async remainder() {
    const schedules = {};
    
    try {
      const data = await fs.readFile(this.SCHEDULE_FILE_PATH, 'utf-8');
      Object.assign(schedules, JSON.parse(data));
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw new Error(`Error reading schedule file: ${err.message}`);
      }
    }
    
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0]; // "2026-01-20"
    
    const todaySchedules = schedules[dateKey];
    if (!todaySchedules || !Array.isArray(todaySchedules)) {
      return; // nothing scheduled today
    }
    
    const now = Date.now();
    
    const upcoming = [];
    
    for (const task of todaySchedules) {
      const taskTimeMs = this.normalizeTime(task.time);
      
      if (taskTimeMs > now) {
        upcoming.push({
          time: task.time,
          timestamp: taskTimeMs,
          ...task
        });
      }
    }
    /* 
  if (upcoming.length > 0) {
      console.log(`You have ${upcoming.length} upcoming task(s) today:`);
      for (const t of upcoming) {
        const when = new Date(t.timestamp);
        console.log(`  • ${t.time} → ${t.description || t.title || 'task'}`);
      }
    } else {
      console.log("No more tasks remaining for today.");
    }
    */
    return upcoming;
  }
  
  
  
  normalizeTime(timeStr = "") {
    if (!timeStr || typeof timeStr !== 'string') return Infinity;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let clean = timeStr.trim().toLowerCase().replace(/\s+/g, '');
    
    // Quick special cases
    if (clean === 'noon') return today.setHours(12, 0, 0);
    if (clean === 'midnight') return today.setHours(0, 0, 0);
    
    // Try to parse with Date
    let dt = new Date(`${today.toDateString()} ${timeStr}`);
    if (!isNaN(dt.getTime())) {
      return dt.getTime();
    }
    
    // Fallback manual parse
    const match24 = clean.match(/^(\d{1,2}):?(\d{2})?$/);
    const match12 = clean.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/);
    
    let h = 0,
      m = 0;
    
    if (match24) {
      h = parseInt(match24[1], 10);
      m = parseInt(match24[2] || '0', 10);
    } else if (match12) {
      h = parseInt(match12[1], 10);
      m = parseInt(match12[2] || '0', 10);
      const period = match12[3];
      if (period === 'pm' && h !== 12) h += 12;
      if (period === 'am' && h === 12) h = 0;
    } else {
      return Infinity;
    }
    
    if (h < 0 || h > 23 || m < 0 || m > 59) return Infinity;
    
    today.setHours(h, m, 0, 0);
    return today.getTime();
  }
}