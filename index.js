require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  PermissionsBitField,
} = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const BOT_CHANNEL_ID = process.env.COMMITGOBLIN_CHANNEL_ID || null;

if (!TOKEN) {
  console.error('❌ No DISCORD_TOKEN found in .env.');
  process.exit(1);
}

// Name of the special roles on the server
const GOLDEN_DEV_ROLE_NAME = 'Golden Dev';

// In-memory focus / Pomodoro sessions
// key: userId -> { type, guildId, channelId, timeouts: [] }
const activeSessions = new Map();

function resolveTargetChannelId(interaction) {
  if (BOT_CHANNEL_ID) return BOT_CHANNEL_ID;
  if (interaction && interaction.channelId) return interaction.channelId;
  return null;
}

function formatBox(title, lines) {
  const contentLines = Array.isArray(lines) ? lines : [lines];
  const all = [title, ...contentLines];
  const maxLen = all.reduce(
    (m, l) => Math.max(m, String(l ?? '').length),
    0
  );
  const innerWidth = Math.min(80, Math.max(24, maxLen + 2));
  const border = '━'.repeat(innerWidth);
  const top = `┏${border}┓`;
  const bottom = `┗${border}┛`;
  const line = (text = '') =>
    `┃ ${String(text ?? '').padEnd(innerWidth - 1, ' ')}┃`;

  const body = contentLines.length
    ? contentLines.map((l) => line(l))
    : [line('')];

  return [top, line(title), line(''), ...body, bottom].join('\n');
}

function formatBotMessage(content) {
  if (!content) return '';
  const trimmed = String(content).trim();
  if (trimmed.startsWith('┏')) return String(content);

  const parts = String(content).split('\n');
  const title = parts.shift() || '';
  const rest = parts.length ? parts : [''];

  return formatBox(title, rest);
}

async function sendMessageToChannel(client, channelId, content) {
  if (!channelId) return false;
  const payload = formatBotMessage(content);

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) throw new Error(`Channel ${channelId} not found`);
    await channel.send(payload);
    return true;
  } catch (err) {
    console.error('Error sending message to channel:', err);
    return false;
  }
}

async function sendPublicMessage(interaction, content) {
  const targetChannelId = resolveTargetChannelId(interaction);
  const formatted = formatBotMessage(content);

  if (!interaction.guild || !targetChannelId) {
    return replyWithBox(interaction, formatted, true);
  }

  const sent = await sendMessageToChannel(
    interaction.client,
    targetChannelId,
    formatted
  );

  const ack = sent
    ? formatBotMessage(`📨 Posted in <#${targetChannelId}>.`)
    : formatBotMessage(
        '⚠️ Could not post in the bot channel, sending it here instead:'
      );

  const replyContent = sent ? ack : `${ack}\n\n${formatted}`;
  return replyWithBox(interaction, replyContent, true);
}

function replyWithBox(interaction, content, ephemeral = true) {
  const formatted = formatBotMessage(content);
  if (interaction.replied || interaction.deferred) {
    return interaction.followUp({ content: formatted, ephemeral });
  }
  return interaction.reply({ content: formatted, ephemeral });
}

// ==== Data storage (JSON file) =============================================

const DATA_FILE = path.join(__dirname, 'data.json');
let store = { users: {}, teams: {}, shop: {} };

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      store = JSON.parse(raw);
      if (!store.users) store.users = {};
      if (!store.teams) store.teams = {};
      if (!store.shop) store.shop = {};
    } else {
      store = { users: {}, teams: {}, shop: {} };
      fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
    }
  } catch (err) {
    console.error('❌ Could not load/parse data.json:', err);
    store = { users: {}, teams: {}, shop: {} };
  }

  initDefaultShop();
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('❌ Could not save data.json:', err);
  }
}

function getUserData(userId) {
    if (!store.users[userId]) {
    store.users[userId] = {
      coins: 0,
      streak: 0,
      lastCheckin: null,
      checkinsTotal: 0,
      items: {},
      activeEffects: [],
      shoutoutsGiven: 0,
      shoutoutsReceived: 0,
      roastsGiven: 0,
      roastsReceived: 0,
      focusStats: {
        day: null,
        minutes: 0,
        coins: 0,
      },
    };
  } else {
    const u = store.users[userId];
    if (typeof u.checkinsTotal !== 'number') u.checkinsTotal = 0;
    if (!u.items) u.items = {};
    if (!Array.isArray(u.activeEffects)) u.activeEffects = [];
    if (typeof u.shoutoutsGiven !== 'number') u.shoutoutsGiven = 0;
    if (typeof u.shoutoutsReceived !== 'number') u.shoutoutsReceived = 0;
    if (typeof u.roastsGiven !== 'number') u.roastsGiven = 0;
    if (typeof u.roastsReceived !== 'number') u.roastsReceived = 0;
    if (!u.focusStats) {
      u.focusStats = { day: null, minutes: 0, coins: 0 };
    }
  }
  return store.users[userId];
}

// ==== Default shop =========================================================

function initDefaultShop() {
  if (!store.shop) store.shop = {};

  const defaults = {
    'golden-dev': {
      id: 'golden-dev',
      name: 'Golden Dev',
      description: 'Golden developer role for 24 hours.',
      cost: 200,
      type: 'role',
      roleName: GOLDEN_DEV_ROLE_NAME,
      durationHours: 24,
    },
    shoutout: {
      id: 'shoutout',
      name: 'Shoutout',
      description: 'A one-time shoutout for a person of your choice.',
      cost: 50,
      type: 'usable',
      usableCommand: 'shoutout',
    },
    roast: {
      id: 'roast',
      name: 'Roast',
      description: 'A friendly nerd roast from CommitGoblin.',
      cost: 50,
      type: 'usable',
      usableCommand: 'roast',
    },
    'raffle-ticket': {
      id: 'raffle-ticket',
      name: 'Raffle Ticket',
      description: 'Ticket for future raffles.',
      cost: 25,
      type: 'ticket',
    },
  };

  for (const [id, item] of Object.entries(defaults)) {
    if (!store.shop[id]) {
      store.shop[id] = item;
    }
  }
  saveStore();
}

// ==== Date helpers =========================================================

function getTodayString() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayString() {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() - 1);
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatItemCountLabel(name, count) {
  if (count === 1) return `1 ${name}`;
  return `${count}× ${name}${name.endsWith('s') ? '' : 's'}`;
}

// ==== Check-in / streak logic ==============================================

function dailyCheckin(userId) {
  const user = getUserData(userId);
  const today = getTodayString();
  const yesterday = getYesterdayString();

  if (user.lastCheckin === today) {
    return {
      alreadyCheckedIn: true,
      streak: user.streak,
      coins: user.coins,
      checkinsTotal: user.checkinsTotal,
      today,
    };
  }

  if (user.lastCheckin === yesterday) {
    user.streak += 1;
  } else {
    user.streak = 1;
  }

  user.checkinsTotal = (user.checkinsTotal || 0) + 1;

  const reward = 10 + Math.min(user.streak, 10);
  user.coins += reward;
  user.lastCheckin = today;

  saveStore();

  return {
    alreadyCheckedIn: false,
    streak: user.streak,
    coins: user.coins,
    checkinsTotal: user.checkinsTotal,
    reward,
    today,
  };
}

// ==== Focus reward logic (anti-grind) ======================================

function grantFocusReward(userId, minutes, source) {
  const user = getUserData(userId);
  const today = getTodayString();

  if (!user.focusStats) {
    user.focusStats = { day: today, minutes: 0, coins: 0 };
  }
  if (user.focusStats.day !== today) {
    user.focusStats.day = today;
    user.focusStats.minutes = 0;
    user.focusStats.coins = 0;
  }

  const MAX_FOCUS_MINUTES_PER_DAY = 120; // max 2h rewarded per day
  const remainingMinutes = MAX_FOCUS_MINUTES_PER_DAY - user.focusStats.minutes;

  if (remainingMinutes <= 0) {
    return {
      granted: false,
      reason: 'cap',
      coins: 0,
      minutesAdded: 0,
      totalMinutes: user.focusStats.minutes,
      totalCoins: user.focusStats.coins,
      maxMinutes: MAX_FOCUS_MINUTES_PER_DAY,
    };
  }

  const minutesToCount = Math.max(0, Math.min(minutes, remainingMinutes));
  const COINS_PER_15_MIN = 5;
  const blocks = Math.floor(minutesToCount / 15);

  user.focusStats.minutes += minutesToCount;

  if (blocks <= 0) {
    saveStore();
    return {
      granted: false,
      reason: 'too_short',
      coins: 0,
      minutesAdded: minutesToCount,
      totalMinutes: user.focusStats.minutes,
      totalCoins: user.focusStats.coins,
      maxMinutes: MAX_FOCUS_MINUTES_PER_DAY,
    };
  }

  const coins = blocks * COINS_PER_15_MIN;
  user.focusStats.coins += coins;
  user.coins += coins;
  saveStore();

  return {
    granted: true,
    reason: 'ok',
    coins,
    minutesAdded: minutesToCount,
    totalMinutes: user.focusStats.minutes,
    totalCoins: user.focusStats.coins,
    maxMinutes: MAX_FOCUS_MINUTES_PER_DAY,
  };
}

// ==== Leaderboard helper (users) ===========================================

function getLeaderboard(sortBy = 'coins', limit = 10) {
  const entries = Object.entries(store.users || {});
  if (!entries.length) return [];

  const list = entries.map(([userId]) => {
    const userData = getUserData(userId);
    return {
      userId,
      coins: userData.coins || 0,
      streak: userData.streak || 0,
      checkinsTotal: userData.checkinsTotal || 0,
    };
  });

  list.sort((a, b) => {
    if (sortBy === 'streak') {
      return b.streak - a.streak || b.coins - a.coins;
    }
    if (sortBy === 'checkins') {
      return b.checkinsTotal - a.checkinsTotal || b.streak - a.streak;
    }
    return b.coins - a.coins || b.streak - a.streak;
  });

  return list.slice(0, limit);
}

// ==== Team helpers ==========================================================

function ensureTeams() {
  if (!store.teams) store.teams = {};
}

function makeTeamId(name) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `team-${Math.floor(Math.random() * 10000)}`;
}

function findTeamByName(name) {
  if (!store.teams) return null;
  const target = name.trim().toLowerCase();
  return (
    Object.values(store.teams).find(
      (t) => t.name.trim().toLowerCase() === target
    ) || null
  );
}

function getUserTeams(userId) {
  ensureTeams();
  return Object.values(store.teams).filter(
    (t) => Array.isArray(t.members) && t.members.includes(userId)
  );
}

function createTeam(name, description, creatorId) {
  ensureTeams();

  if (findTeamByName(name)) {
    return { error: 'exists' };
  }

  let id = makeTeamId(name);
  let suffix = 1;
  while (store.teams[id]) {
    id = `${id}-${suffix++}`;
  }

  const team = {
    id,
    name: name.trim(),
    description: description?.trim() || 'No description yet.',
    createdBy: creatorId,
    createdAt: new Date().toISOString(),
    members: [creatorId],
  };

  store.teams[id] = team;
  saveStore();
  return { team };
}

function joinTeamByName(teamName, userId) {
  ensureTeams();
  const team = findTeamByName(teamName);
  if (!team) return { error: 'notfound' };

  if (!Array.isArray(team.members)) {
    team.members = [];
  }

  if (team.members.includes(userId)) {
    return { error: 'already' };
  }

  team.members.push(userId);
  saveStore();
  return { team };
}

function leaveTeamByName(teamName, userId) {
  ensureTeams();
  const team = findTeamByName(teamName);
  if (!team) return { error: 'notfound' };

  if (!Array.isArray(team.members)) {
    team.members = [];
  }

  if (!team.members.includes(userId)) {
    return { error: 'notmember' };
  }

  team.members = team.members.filter((id) => id !== userId);
  saveStore();
  return { team };
}

function renameTeam(oldName, newName, userId) {
  ensureTeams();
  const team = findTeamByName(oldName);
  if (!team) return { error: 'notfound' };

  if (team.createdBy !== userId) {
    return { error: 'forbidden' };
  }

  if (findTeamByName(newName)) {
    return { error: 'exists' };
  }

  team.name = newName.trim();
  saveStore();
  return { team };
}

function setTeamDescription(name, newDescription, userId) {
  ensureTeams();
  const team = findTeamByName(name);
  if (!team) return { error: 'notfound' };

  if (team.createdBy !== userId) {
    return { error: 'forbidden' };
  }

  team.description = newDescription.trim();
  saveStore();
  return { team };
}

function kickFromTeam(teamName, targetUserId, actingUserId) {
  ensureTeams();
  const team = findTeamByName(teamName);
  if (!team) return { error: 'notfound' };

  if (team.createdBy !== actingUserId) {
    return { error: 'forbidden' };
  }

  if (!Array.isArray(team.members) || !team.members.includes(targetUserId)) {
    return { error: 'notmember' };
  }

  // BUGFIX: we need to remove targetUserId, not actingUserId
  team.members = team.members.filter((id) => id !== targetUserId);
  saveStore();
  return { team };
}

// ==== Team leaderboard ======================================================

function getTeamLeaderboard(sortBy = 'coins', limit = 10) {
  ensureTeams();
  const teams = Object.values(store.teams || {});
  if (!teams.length) return [];

  const aggregated = teams.map((t) => {
    const members = t.members || [];
    let sumCoins = 0;
    let sumCheckins = 0;
    let bestStreak = 0;

    for (const uid of members) {
      const u = getUserData(uid);
      sumCoins += u.coins || 0;
      sumCheckins += u.checkinsTotal || 0;
      if ((u.streak || 0) > bestStreak) {
        bestStreak = u.streak || 0;
      }
    }

    return {
      teamId: t.id,
      name: t.name,
      membersCount: members.length,
      coins: sumCoins,
      checkinsTotal: sumCheckins,
      bestStreak,
    };
  });

  // only teams with at least one member
  const list = aggregated.filter((t) => t.membersCount > 0);
  if (!list.length) return [];

  list.sort((a, b) => {
    if (sortBy === 'checkins') {
      return b.checkinsTotal - a.checkinsTotal || b.coins - a.coins;
    }
    if (sortBy === 'streak') {
      return b.bestStreak - a.bestStreak || b.coins - a.coins;
    }
    // coins
    return b.coins - a.coins || b.checkinsTotal - a.checkinsTotal;
  });

  return list.slice(0, limit);
}

// ==== Shop helpers ==========================================================

const ITEM_ALIASES = {
  'honor-scroll': 'shoutout',
  'roast-scroll': 'roast',
};

function findShopItem(idOrName) {
  if (!store.shop) return null;
  const raw = idOrName.trim().toLowerCase();
  const key = ITEM_ALIASES[raw] || raw;

  if (store.shop[key]) return store.shop[key];
  return (
    Object.values(store.shop).find(
      (item) => item.name.trim().toLowerCase() === key
    ) || null
  );
}

function addItemToUser(userId, itemId, amount) {
  const user = getUserData(userId);
  if (!user.items[itemId]) user.items[itemId] = 0;
  user.items[itemId] += amount;
  saveStore();
  return user.items[itemId];
}

async function cleanupActiveEffectsForUser(userId, member) {
  const user = getUserData(userId);
  if (!user.activeEffects || !user.activeEffects.length) return;

  const now = Date.now();
  let changed = false;
  const remaining = [];

  for (const eff of user.activeEffects) {
    if (!eff.expiresAt) {
      remaining.push(eff);
      continue;
    }
    const exp = new Date(eff.expiresAt).getTime();
    if (exp > now) {
      remaining.push(eff);
      continue;
    }

    if (eff.type === 'role' && eff.roleId && member && member.roles) {
      const role = member.roles.cache.get(eff.roleId);
      if (role) {
        try {
          await member.roles.remove(role);
        } catch (err) {
          console.error('Error while removing a role:', err);
        }
      }
    }

    changed = true;
  }

  if (changed) {
    user.activeEffects = remaining;
    saveStore();
  }
}

// ==== Focus / Pomodoro helpers =============================================

function hasActiveSession(userId) {
  return activeSessions.has(userId);
}

function stopSession(userId) {
  const session = activeSessions.get(userId);
  if (!session) return false;
  if (Array.isArray(session.timeouts)) {
    for (const t of session.timeouts) {
      clearTimeout(t);
    }
  }
  activeSessions.delete(userId);
  return true;
}

function startFocusSession(client, userId, guildId, channelId, minutes) {
  const timeouts = [];
  activeSessions.set(userId, {
    type: 'focus',
    guildId,
    channelId,
    timeouts,
  });

  const ms = minutes * 60 * 1000;
  const timeout = setTimeout(async () => {
    activeSessions.delete(userId);
    try {
      const reward = grantFocusReward(userId, minutes, 'focus');

      let msg = `⏰ Focus session for <@${userId}> has ended. Take a short breath — then keep going!`;
      if (reward.granted) {
        msg += `\n💰 Focus bonus: **${reward.coins}** coins (today's focus bonus total **${reward.totalCoins}** coins, counting ~${reward.totalMinutes}/${reward.maxMinutes} minutes).`;
      } else if (reward.reason === 'cap') {
        msg += `\n💰 Focus bonus: You've already reached today's maximum focus coins. Strong work! 💪`;
      } else if (reward.reason === 'too_short') {
        msg += `\nℹ️ Focus sessions under about 15 minutes do not give a coin bonus.`;
      }

      const sent = await sendMessageToChannel(client, channelId, msg);
      if (!sent) {
        console.error('Focus timer could not post to target channel.');
      }
    } catch (err) {
      console.error('Error in focus timer:', err);
    }
  }, ms);

  timeouts.push(timeout);
}

function startPomodoroSession(
  client,
  userId,
  guildId,
  channelId,
  workMinutes,
  breakMinutes,
  rounds
) {
  const timeouts = [];
  const session = {
    type: 'pomodoro',
    guildId,
    channelId,
    timeouts,
  };
  activeSessions.set(userId, session);

  const totalPhases = rounds * 2 - 1; // W1,B1,W2,B2,...,Wn (ends with work)
  let phase = 0;

  const runPhase = async () => {
    if (!activeSessions.has(userId)) return; // was stopped

    const isWork = phase % 2 === 0;
    const currentRound = Math.floor(phase / 2) + 1;
    const minutes = isWork ? workMinutes : breakMinutes;

    const startMsg = isWork
      ? `🧠 Focus round ${currentRound}/${rounds} for <@${userId}> started (${minutes} minutes).`
      : `☕ Break for <@${userId}> started (${minutes} minutes).`;

    const started = await sendMessageToChannel(client, channelId, startMsg);
    if (!started) {
      console.error('Pomodoro phase start could not post to target channel.');
    }

    const timeout = setTimeout(async () => {
      if (!activeSessions.has(userId)) return; // session may have been stopped

      let msg;
      if (isWork) {
        msg = `⏰ Focus round ${currentRound}/${rounds} for <@${userId}> completed.`;

        const reward = grantFocusReward(userId, workMinutes, 'pomodoro');
        if (reward.granted) {
          msg += `\n💰 Focus bonus: **${reward.coins}** coins (today's focus bonus total **${reward.totalCoins}** coins, counting ~${reward.totalMinutes}/${reward.maxMinutes} minutes).`;
        } else if (reward.reason === 'cap') {
          msg += `\n💰 Focus bonus: Daily focus coin limit reached — you crushed it today! 💪`;
        } else if (reward.reason === 'too_short') {
          msg += `\nℹ️ Focus rounds under about 15 minutes do not give a coin bonus.`;
        }
      } else {
        msg = `⏰ Break for <@${userId}> ended.`;
      }

      const ended = await sendMessageToChannel(client, channelId, msg);
      if (!ended) {
        console.error('Pomodoro phase end could not post to target channel.');
      }

      phase++;
      if (phase < totalPhases && activeSessions.has(userId)) {
        runPhase();
      } else {
        activeSessions.delete(userId);
        const completed = await sendMessageToChannel(
          client,
          channelId,
          `✅ Pomodoro session for <@${userId}> is fully complete! Great job. 💪`
        );
        if (!completed) {
          console.error('Pomodoro completion could not post to target channel.');
        }
      }
    }, minutes * 60 * 1000);

    timeouts.push(timeout);
  };

  runPhase();
}

// ==== Discord client ========================================================

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Define slash commands
const commands = [
  {
    name: 'ping',
    description: 'Check if CommitGoblin is awake.',
  },
  {
    name: 'info',
    description: 'Information about the After-Class IT server.',
  },
  {
    name: 'motivate',
    description: 'Gives you a motivational quote.',
  },
  {
    name: 'checkin',
    description: 'Daily check-in: coins + streak.',
  },
  {
    name: 'balance',
    description: 'Shows your coins and streak.',
  },
  {
    name: 'leaderboard',
    description: 'Shows the user leaderboard.',
    options: [
      {
        name: 'type',
        description: 'Type of leaderboard',
        type: 3,
        required: false,
        choices: [
          { name: 'Coins', value: 'coins' },
          { name: 'Streak', value: 'streak' },
          { name: 'Check-ins', value: 'checkins' },
        ],
      },
    ],
  },
  {
    name: 'team-leaderboard',
    description: 'Shows the team leaderboard.',
    options: [
      {
        name: 'type',
        description: 'Type of leaderboard',
        type: 3,
        required: false,
        choices: [
          { name: 'Coins (Total)', value: 'coins' },
          { name: 'Check-ins (Total)', value: 'checkins' },
          { name: 'Best Streak', value: 'streak' },
        ],
      },
    ],
  },
  {
    name: 'team-create',
    description: 'Creates a new team.',
    options: [
      {
        name: 'name',
        description: 'Name of the team',
        type: 3,
        required: true,
      },
      {
        name: 'description',
        description: 'Short description',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'team-join',
    description: 'Join an existing team.',
    options: [
      {
        name: 'name',
        description: 'Name of the team',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'team-leave',
    description: 'Leave a team.',
    options: [
      {
        name: 'name',
        description: 'Name of the team',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'team-info',
    description: 'Shows info about a team or your team.',
    options: [
      {
        name: 'name',
        description: 'Name of the team (optional)',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'team-list',
    description: 'Shows an overview of all teams.',
  },
  {
    name: 'team-rename',
    description: 'Rename a team (creator only).',
    options: [
      {
        name: 'old_name',
        description: 'Current name of the team',
        type: 3,
        required: true,
      },
      {
        name: 'new_name',
        description: 'New name of the team',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'team-set-description',
    description: 'Set description of a team (creator only).',
    options: [
      {
        name: 'name',
        description: 'Name of the team',
        type: 3,
        required: true,
      },
      {
        name: 'description',
        description: 'New description',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'team-kick',
    description: 'Remove a member from a team (creator only).',
    options: [
      {
        name: 'name',
        description: 'Name of the team',
        type: 3,
        required: true,
      },
      {
        name: 'member',
        description: 'Member to remove',
        type: 6,
        required: true,
      },
    ],
  },
  {
    name: 'shop',
    description: 'Shows available shop items.',
  },
  {
    name: 'buy',
    description: 'Buy an item from the shop.',
    options: [
      {
        name: 'item',
        description: 'ID or name of the item',
        type: 3,
        required: true,
      },
      {
        name: 'amount',
        description: 'Amount (default: 1)',
        type: 4,
        required: false,
      },
    ],
  },
  {
    name: 'my-items',
    description: 'Shows your inventory.',
  },
  {
    name: 'use-item',
    description: 'Use an item from your inventory.',
    options: [
      {
        name: 'item',
        description: 'ID or name of the item',
        type: 3,
        required: true,
      },
      {
        name: 'target',
        description: 'Target user (required for some items)',
        type: 6,
        required: false,
      },
      {
        name: 'note',
        description: 'Note (optional) for shoutouts/roasts',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'focus',
    description: 'Starts a focus session.',
    options: [
      {
        name: 'duration',
        description: 'Duration in minutes (e.g. 25)',
        type: 4,
        required: true,
        min_value: 5,
        max_value: 180,
      },
    ],
  },
  {
    name: 'focus-stop',
    description: 'Stops your current focus or Pomodoro session.',
  },
  {
    name: 'pomodoro',
    description: 'Starts a Pomodoro session (focus & break rounds).',
    options: [
      {
        name: 'work_minutes',
        description: 'Duration of focus rounds (default: 25)',
        type: 4,
        required: false,
        min_value: 5,
        max_value: 120,
      },
      {
        name: 'break_minutes',
        description: 'Duration of breaks (default: 5)',
        type: 4,
        required: false,
        min_value: 1,
        max_value: 60,
      },
      {
        name: 'rounds',
        description: 'Number of focus rounds (default: 4)',
        type: 4,
        required: false,
        min_value: 1,
        max_value: 8,
      },
    ],
  },
  {
    name: 'focus-status',
    description: 'Shows who is currently in focus or Pomodoro mode.',
  },
  {
    name: 'admin-give-coins',
    description: 'Admin: Give a user coins.',
    options: [
      {
        name: 'user',
        description: 'Target user',
        type: 6,
        required: true,
      },
      {
        name: 'amount',
        description: 'Amount of coins (can be negative)',
        type: 4,
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason (optional)',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'admin-give-item',
    description: 'Admin: Give a user a shop item.',
    options: [
      {
        name: 'user',
        description: 'Target user',
        type: 6,
        required: true,
      },
      {
        name: 'item',
        description: 'Item ID or name',
        type: 3,
        required: true,
      },
      {
        name: 'amount',
        description: 'Amount (default: 1)',
        type: 4,
        required: false,
      },
    ],
  },
];

// On ready: register commands per guild
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  loadStore();

  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    const guilds = await client.guilds.fetch();

    for (const [guildId, guild] of guilds) {
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guildId),
        { body: commands }
      );
      console.log(
        `🔧 Slash commands registered for guild ${guild.name} (${guildId}).`
      );
    }

    console.log('✅ All slash commands registered.');
  } catch (error) {
    console.error('❌ Error while registering commands:', error);
  }
});

// Handle interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;

  // clean up expired effects for this user
  if (interaction.guild && interaction.member) {
    await cleanupActiveEffectsForUser(user.id, interaction.member);
  }

  // --- Focus / Pomodoro commands -------------------------------------------

  if (commandName === 'focus') {
    if (!interaction.guild || !interaction.channelId) {
      return replyWithBox(
        interaction,
        '❌ Focus sessions only work in a server channel.',
        true
      );
    }

    if (hasActiveSession(user.id)) {
      return replyWithBox(
        interaction,
        'ℹ️ You already have an active focus or Pomodoro session. Use `/focus-stop` to end it.',
        true
      );
    }

    const duration = interaction.options.getInteger('duration');
    const targetChannelId = resolveTargetChannelId(interaction);
    startFocusSession(
      client,
      user.id,
      interaction.guildId,
      targetChannelId,
      duration
    );

    return sendPublicMessage(
      interaction,
      `🧠 <@${user.id}> started a focus session for **${duration} minutes**. You got this!`
    );
  }

  if (commandName === 'focus-stop') {
    const stopped = stopSession(user.id);
    if (!stopped) {
      return replyWithBox(
        interaction,
        'ℹ️ You currently have no active focus or Pomodoro session.',
        true
      );
    }

    return replyWithBox(
      interaction,
      '⏹️ Your active focus/Pomodoro session has been stopped.',
      true
    );
  }

  if (commandName === 'pomodoro') {
    if (!interaction.guild || !interaction.channelId) {
      return replyWithBox(
        interaction,
        '❌ Pomodoro sessions only work in a server channel.',
        true
      );
    }

    if (hasActiveSession(user.id)) {
      return replyWithBox(
        interaction,
        'ℹ️ You already have an active focus or Pomodoro session. Use `/focus-stop` to end it.',
        true
      );
    }

    let work = interaction.options.getInteger('work_minutes') ?? 25;
    let pause = interaction.options.getInteger('break_minutes') ?? 5;
    let rounds = interaction.options.getInteger('rounds') ?? 4;

    work = Math.min(Math.max(work, 5), 120);
    pause = Math.min(Math.max(pause, 1), 60);
    rounds = Math.min(Math.max(rounds, 1), 8);

    const targetChannelId = resolveTargetChannelId(interaction);
    startPomodoroSession(
      client,
      user.id,
      interaction.guildId,
      targetChannelId,
      work,
      pause,
      rounds
    );

    return sendPublicMessage(
      interaction,
      `🍅 Pomodoro session for <@${user.id}> started: **${rounds} rounds** of **${work} min focus** + **${pause} min break**.`
    );
  }

  if (commandName === 'focus-status') {
    if (!interaction.guild) {
      return replyWithBox(
        interaction,
        '❌ This command only works in a server.',
        true
      );
    }

    const sessions = Array.from(activeSessions.entries()).filter(
      ([, s]) => s.guildId === interaction.guildId
    );

    if (!sessions.length) {
      return sendPublicMessage(
        interaction,
        '📚 Nobody is currently in a focus or Pomodoro session.'
      );
    }

    const lines = sessions.map(([uid, s]) => {
      const label = s.type === 'pomodoro' ? 'Pomodoro' : 'Focus';
      return `• <@${uid}> – ${label}`;
    });

    return sendPublicMessage(
      interaction,
      ['📚 **Active focus/Pomodoro sessions:**', '', ...lines].join('\n')
    );
  }

  // --- Admin commands -------------------------------------------------------

  if (commandName === 'admin-give-coins') {
    if (
      !interaction.memberPermissions ||
      !interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return replyWithBox(
        interaction,
        '❌ Only admins can use this command.',
        true
      );
    }

    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const reason =
      interaction.options.getString('reason') || 'no reason provided';

    const userData = getUserData(target.id);
    userData.coins += amount;
    saveStore();

    return sendPublicMessage(
      interaction,
      [
        `🪙 Admin give: <@${target.id}> receives **${amount}** coins.`,
        `💰 New balance: **${userData.coins}** coins.`,
        `📝 Reason: ${reason}`,
      ].join('\n')
    );
  }

  if (commandName === 'admin-give-item') {
    if (
      !interaction.memberPermissions ||
      !interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return replyWithBox(
        interaction,
        '❌ Only admins can use this command.',
        true
      );
    }

    const target = interaction.options.getUser('user');
    const idOrName = interaction.options.getString('item');
    let amount = interaction.options.getInteger('amount') || 1;
    if (amount < 1) amount = 1;

    const item = findShopItem(idOrName);
    if (!item) {
      return replyWithBox(
        interaction,
        `❌ I don't know any item with ID/name **${idOrName}**.`,
        true
      );
    }

    const newAmount = addItemToUser(target.id, item.id, amount);

    return sendPublicMessage(
      interaction,
      [
        `🎁 Admin give: <@${target.id}> receives **${amount}× ${item.name}**.`,
        `🎒 User now owns **${newAmount}× ${item.name}**.`,
      ].join('\n')
    );
  }

  // --- Basic commands -------------------------------------------------------

  if (commandName === 'ping') {
    return replyWithBox(interaction, 'Pong 🏓 – CommitGoblin is awake!', true);
  }

  if (commandName === 'info') {
    return replyWithBox(
      interaction,
      [
        '🎓 **After-Class IT Server**',
        '',
        'Here you can after class:',
        '- continue working on projects',
        '- ask questions',
        '- build features in teams',
        '- connect with other learners',
        '',
        'Everything is **optional**, but the more often you show up, the more synergy you create. ✨',
      ].join('\n'),
      true
    );
  }

  if (commandName === 'motivate') {
    const lines = [
      'Every line of code is XP for your future self. 💪',
      'Small steps are still steps forward. 🚶‍♂️',
      'You don’t need to be perfect — just a bit better than yesterday. 🌱',
      'Found a bug? Nice, that’s a free lesson. 🐛➡️✨',
      '10 minutes of focus beats an hour of procrastination. ⏱️',
      'Your future self will thank you for every minute you invest today. 🔮',
    ];
    const random = lines[Math.floor(Math.random() * lines.length)];
    return replyWithBox(interaction, random, true);
  }

  if (commandName === 'checkin') {
    const result = dailyCheckin(user.id);

    if (result.alreadyCheckedIn) {
      return replyWithBox(
        interaction,
        [
          `You already checked in today, <@${user.id}> ✅`,
          `📅 Date: ${result.today}`,
          `🔥 Current streak: **${result.streak}** days`,
          `💰 Total coins: **${result.coins}**`,
          `✅ Total check-ins: **${result.checkinsTotal}**`,
        ].join('\n'),
        true
      );
    }

    return replyWithBox(
      interaction,
      [
        `Thanks for checking in, <@${user.id}> ✅`,
        `📅 Date: ${result.today}`,
        `🔥 New streak: **${result.streak}** days in a row!`,
        `💰 Reward: **${result.reward}** coins`,
        `💳 Total coins: **${result.coins}**`,
        `✅ Total check-ins: **${result.checkinsTotal}**`,
      ].join('\n'),
      true
    );
  }

  if (commandName === 'balance') {
    const data = getUserData(user.id);
    return replyWithBox(
      interaction,
      [
        `💳 **CommitGoblin account for <@${user.id}>**`,
        `💰 Coins: **${data.coins}**`,
        `🔥 Streak: **${data.streak}** days`,
        data.lastCheckin
          ? `📅 Last check-in: **${data.lastCheckin}**`
          : '📅 No check-in yet – try `/checkin`!',
        `✅ Total check-ins: **${data.checkinsTotal}**`,
        `🎤 Shoutouts given: **${data.shoutoutsGiven || 0}**`,
        `🎤 Shoutouts received: **${data.shoutoutsReceived || 0}**`,
        `🔥 Roasts given: **${data.roastsGiven || 0}**`,
        `🔥 Roasts received: **${data.roastsReceived || 0}**`,
      ].join('\n'),
      true
    );
  }

  if (commandName === 'leaderboard') {
    const type = interaction.options.getString('type') || 'coins';

    const lb = getLeaderboard(type, 10);

    if (!lb.length) {
      return replyWithBox(
        interaction,
        'No data for the leaderboard yet. Be the first to `/checkin`! ✨',
        true
      );
    }

    let title = '🏆 Leaderboard – Coins';
    let valueLabel = 'coins';

    if (type === 'streak') {
      title = '🔥 Leaderboard – Streak';
      valueLabel = 'days streak';
    } else if (type === 'checkins') {
      title = '✅ Leaderboard – Check-ins';
      valueLabel = 'check-ins';
    }

    const lines = lb.map((entry, index) => {
      let value = entry.coins;
      if (type === 'streak') value = entry.streak;
      if (type === 'checkins') value = entry.checkinsTotal;

      const place = index + 1;
      const medal =
        place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : '➤';

      return `${medal} **#${place}** – <@${entry.userId}> – **${value} ${valueLabel}**`;
    });

    return sendPublicMessage(interaction, [title, '', ...lines].join('\n'));
  }

  if (commandName === 'team-leaderboard') {
    const type = interaction.options.getString('type') || 'coins';
    const lb = getTeamLeaderboard(type, 10);

    if (!lb.length) {
      return replyWithBox(
        interaction,
        'No data for the team leaderboard yet. Create teams and let people join!',
        true
      );
    }

    let title = '🏆 Team Leaderboard – Coins (Total)';
    let valueLabel = 'coins';

    if (type === 'checkins') {
      title = '📊 Team Leaderboard – Check-ins (Total)';
      valueLabel = 'check-ins';
    } else if (type === 'streak') {
      title = '🔥 Team Leaderboard – Best Streak';
      valueLabel = 'days streak (best member)';
    }

    const lines = lb.map((team, index) => {
      let value = team.coins;
      if (type === 'checkins') value = team.checkinsTotal;
      if (type === 'streak') value = team.bestStreak;

      const place = index + 1;
      const medal =
        place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : '➤';

      return `${medal} **#${place}** – **${team.name}** – **${value} ${valueLabel}** (${team.membersCount} members)`;
    });

    return sendPublicMessage(interaction, [title, '', ...lines].join('\n'));
  }

  // --- Team commands --------------------------------------------------------

  if (commandName === 'team-create') {
    const name = interaction.options.getString('name');
    const description =
      interaction.options.getString('description') || undefined;

    const result = createTeam(name, description, user.id);

    if (result.error === 'exists') {
      return replyWithBox(
        interaction,
        `❌ A team with the name **${name}** already exists.`,
        true
      );
    }

    const team = result.team;
    return sendPublicMessage(
      interaction,
      [
        `🎉 Team **${team.name}** has been created!`,
        `👤 Creator: <@${team.createdBy}>`,
        `📝 Description: ${team.description}`,
        `👥 Members: <@${team.createdBy}>`,
      ].join('\n')
    );
  }

  if (commandName === 'team-join') {
    const name = interaction.options.getString('name');
    const result = joinTeamByName(name, user.id);

    if (result.error === 'notfound') {
      return replyWithBox(
        interaction,
        `❌ There is no team with the name **${name}**.`,
        true
      );
    }
    if (result.error === 'already') {
      return replyWithBox(
        interaction,
        `ℹ️ You are already a member of **${name}**.`,
        true
      );
    }

    const team = result.team;
    return sendPublicMessage(
      interaction,
      `✅ <@${user.id}> joined the team **${team.name}**!`
    );
  }

  if (commandName === 'team-leave') {
    const name = interaction.options.getString('name');
    const result = leaveTeamByName(name, user.id);

    if (result.error === 'notfound') {
      return replyWithBox(
        interaction,
        `❌ There is no team with the name **${name}**.`,
        true
      );
    }
    if (result.error === 'notmember') {
      return replyWithBox(
        interaction,
        `ℹ️ You are not a member of **${name}**.`,
        true
      );
    }

    const team = result.team;
    return sendPublicMessage(
      interaction,
      `👋 <@${user.id}> left the team **${team.name}**.`
    );
  }

  if (commandName === 'team-info') {
    let name = interaction.options.getString('name');
    let team = null;

    if (name) {
      team = findTeamByName(name);
      if (!team) {
        return replyWithBox(
          interaction,
          `❌ There is no team with the name **${name}**.`,
          true
        );
      }
    } else {
      const myTeams = getUserTeams(user.id);
      if (myTeams.length === 0) {
        return replyWithBox(
          interaction,
          'ℹ️ You are not in any team right now. Use `/team-join` or `/team-create`.',
          true
        );
      } else if (myTeams.length > 1) {
        const list = myTeams.map((t) => `• **${t.name}**`).join('\n');
        return replyWithBox(
          interaction,
          [
            'ℹ️ You are in multiple teams. Please specify a team name:',
            '',
            list,
          ].join('\n'),
          true
        );
      } else {
        team = myTeams[0];
      }
    }

    const memberCount = team.members?.length || 0;
    const memberList =
      (team.members || [])
        .slice(0, 10)
        .map((id) => `<@${id}>`)
        .join(', ') || '–';

    return sendPublicMessage(
      interaction,
      [
        `📘 **Team: ${team.name}**`,
        '',
        `📝 Description: ${team.description}`,
        `👤 Creator: <@${team.createdBy}>`,
        `👥 Members (${memberCount}): ${memberList}`,
        `🆔 ID: \`${team.id}\``,
      ].join('\n')
    );
  }

  if (commandName === 'team-list') {
    ensureTeams();
    const teams = Object.values(store.teams);

    if (!teams.length) {
      return replyWithBox(
        interaction,
        'No teams have been created yet. Use `/team-create` to create one.',
        true
      );
    }

    const lines = teams
      .sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0))
      .slice(0, 25)
      .map((t) => {
        const count = t.members?.length || 0;
        return `• **${t.name}** – ${count} member${count === 1 ? '' : 's'}`;
      });

    return sendPublicMessage(
      interaction,
      ['📋 **Team overview:**', '', ...lines].join('\n')
    );
  }

  if (commandName === 'team-rename') {
    const oldName = interaction.options.getString('old_name');
    const newName = interaction.options.getString('new_name');

    const result = renameTeam(oldName, newName, user.id);

    if (result.error === 'notfound') {
      return replyWithBox(
        interaction,
        `❌ There is no team with the name **${oldName}**.`,
        true
      );
    }
    if (result.error === 'forbidden') {
      return replyWithBox(
        interaction,
        '❌ Only the team creator can rename the team.',
        true
      );
    }
    if (result.error === 'exists') {
      return replyWithBox(
        interaction,
        `❌ A team with the name **${newName}** already exists.`,
        true
      );
    }

    const team = result.team;
    return sendPublicMessage(
      interaction,
      `✏️ Team has been renamed to **${team.name}**.`
    );
  }

  if (commandName === 'team-set-description') {
    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');

    const result = setTeamDescription(name, description, user.id);

    if (result.error === 'notfound') {
      return replyWithBox(
        interaction,
        `❌ There is no team with the name **${name}**.`,
        true
      );
    }
    if (result.error === 'forbidden') {
      return replyWithBox(
        interaction,
        '❌ Only the team creator can change the description.',
        true
      );
    }

    const team = result.team;
    return sendPublicMessage(
      interaction,
      [`📝 Description for **${team.name}** updated:`, team.description].join(
        '\n'
      )
    );
  }

  if (commandName === 'team-kick') {
    const name = interaction.options.getString('name');
    const target = interaction.options.getUser('member');

    const result = kickFromTeam(name, target.id, user.id);

    if (result.error === 'notfound') {
      return replyWithBox(
        interaction,
        `❌ There is no team with the name **${name}**.`,
        true
      );
    }
    if (result.error === 'forbidden') {
      return replyWithBox(
        interaction,
        '❌ Only the team creator can remove members.',
        true
      );
    }
    if (result.error === 'notmember') {
      return replyWithBox(
        interaction,
        `ℹ️ <@${target.id}> is not a member of **${name}**.`,
        true
      );
    }

    const team = result.team;
    return sendPublicMessage(
      interaction,
      `🚪 <@${target.id}> has been removed from team **${team.name}**.`
    );
  }

  // --- Shop commands --------------------------------------------------------

  if (commandName === 'shop') {
    const items = Object.values(store.shop || {});
    if (!items.length) {
      return replyWithBox(
        interaction,
        '🛒 The shop is currently empty.',
        true
      );
    }

    const lines = items.map(
      (item) =>
        `• **${item.name}** (\`${item.id}\`) – ${item.cost} coins\n  _${item.description}_`
    );

    return replyWithBox(
      interaction,
      [
        '🛒 **CommitGoblin\'s Shop**',
        '',
        ...lines,
        '',
        'Use `/buy item:<id>` to purchase something.',
      ].join('\n'),
      true
    );
  }

  if (commandName === 'buy') {
    const idOrName = interaction.options.getString('item');
    let amount = interaction.options.getInteger('amount') || 1;
    if (amount < 1) amount = 1;

    const item = findShopItem(idOrName);
    if (!item) {
      return replyWithBox(
        interaction,
        `❌ I don't know any item with ID/name **${idOrName}**.`,
        true
      );
    }

    const userData = getUserData(user.id);
    const totalCost = item.cost * amount;

    if (userData.coins < totalCost) {
      return replyWithBox(
        interaction,
        `❌ You don't have enough coins. You need **${totalCost}**, but you only have **${userData.coins}**.`,
        true
      );
    }

    userData.coins -= totalCost;

    if (item.type === 'role') {
      if (!interaction.guild || !interaction.member) {
        return replyWithBox(
          interaction,
          '❌ Roles can only be assigned in a server context.',
          true
        );
      }

      const role = interaction.guild.roles.cache.find(
        (r) => r.name === item.roleName
      );

      if (!role) {
        userData.coins += totalCost;
        saveStore();
        return replyWithBox(
          interaction,
          `❌ The role **${item.roleName}** does not exist on this server. Please create it in the server settings.`,
          true
        );
      }

      try {
        await interaction.member.roles.add(role);
      } catch (err) {
        console.error('Error while adding role:', err);
        userData.coins += totalCost;
        saveStore();
        return replyWithBox(
          interaction,
          '❌ Could not assign the role (am I missing permissions?). Please check the role hierarchy.',
          true
        );
      }

      const durationMs = (item.durationHours || 24) * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + durationMs).toISOString();

      userData.activeEffects.push({
        type: 'role',
        roleId: role.id,
        itemId: item.id,
        expiresAt,
      });

      saveStore();

      return replyWithBox(
        interaction,
        [
          `✨ You bought **${item.name}** and received the role <@&${role.id}>!`,
          `⏳ Valid for about ${item.durationHours || 24} hours.`,
          `💰 Remaining coins: **${userData.coins}**`,
        ].join('\n'),
        true
      );
    }

    const newAmount = addItemToUser(user.id, item.id, amount);
    saveStore();

    const boughtLabel = formatItemCountLabel(item.name, amount);
    const ownedLabel = formatItemCountLabel(item.name, newAmount);

    return replyWithBox(
      interaction,
      [
        `✅ You bought **${boughtLabel}**.`,
        `💰 Remaining coins: **${userData.coins}**`,
        `🎒 You now own **${ownedLabel}**.`,
      ].join('\n'),
      true
    );
  }

  if (commandName === 'my-items') {
    const userData = getUserData(user.id);
    const items = userData.items || {};
    const entries = Object.entries(items).filter(([, qty]) => qty > 0);

    if (!entries.length) {
      return replyWithBox(
        interaction,
        '🎒 Your inventory is empty. Grab something with `/shop` and `/buy`.',
        true
      );
    }

    const lines = entries.map(([itemId, qty]) => {
      const item = store.shop[itemId];
      const name = item ? item.name : itemId;
      return `• **${name}** (\`${itemId}\`) – Amount: **${qty}**`;
    });

    return replyWithBox(
      interaction,
      [
        `🎒 **Inventory of <@${user.id}>**`,
        '',
        ...lines,
      ].join('\n'),
      true
    );
  }

  if (commandName === 'use-item') {
    const idOrName = interaction.options.getString('item');
    const targetUser = interaction.options.getUser('target') || null;
    const note = interaction.options.getString('note')?.trim() || '';

    const item = findShopItem(idOrName);
    if (!item) {
      return replyWithBox(
        interaction,
        `❌ I don't know any item with ID/name **${idOrName}**.`,
        true
      );
    }

    const userData = getUserData(user.id);
    const count = userData.items[item.id] || 0;

    if (count <= 0) {
      return replyWithBox(
        interaction,
        `❌ You do not own **${item.name}**.`,
        true
      );
    }

    if (item.type === 'usable' && item.usableCommand === 'shoutout') {
      if (!targetUser) {
        return replyWithBox(
          interaction,
          '❌ For this item you must specify a target user (`target:@User`).',
          true
        );
      }

      const targetData = getUserData(targetUser.id);

      userData.items[item.id] = count - 1;
      userData.shoutoutsGiven += 1;
      targetData.shoutoutsReceived += 1;
      saveStore();

      const noteLine = note ? `┃ Note:      ${note}` : null;
      const shoutoutMessage = [
        '┏━━━━━ 🏅🎤 Shoutout 🎤🏅 ━━━━━',
        `┃ Recipient: <@${targetUser.id}>`,
        `┃ From:      <@${user.id}>`,
        '┃',
        noteLine || '┃ Keep crushing it! 💪',
        '┗━━━━━━━━━━━━━━━━━━━━━━',
      ].join('\n');

      return sendPublicMessage(
        interaction,
        shoutoutMessage
      );
    }

    if (item.type === 'usable' && item.usableCommand === 'roast') {
      const roasts = [
        'Your code runs — but only because the bugs are afraid of you. 😎',
        'You’ve got 99 problems, and a semicolon is definitely one of them. ;)',
        'If your code can run, it can also stumble — and wow, does it stumble. 🐧',
        'Stack Overflow called — they want their top customer back. 📞',
        'You call it a feature, I call it “mutated requirements”. 🤡',
      ];
      const roast = roasts[Math.floor(Math.random() * roasts.length)];

      const targetId = targetUser ? targetUser.id : user.id;
      const targetData = getUserData(targetId);

      userData.items[item.id] = count - 1;
      userData.roastsGiven += 1;
      targetData.roastsReceived += 1;
      saveStore();

      const courtesy =
        targetUser && targetUser.id !== user.id
          ? ` (courtesy of <@${user.id}>)`
          : '';

      return sendPublicMessage(
        interaction,
        `🔥 CommitGoblin's roast for <@${targetId}>${courtesy}:\n> ${roast}`
      );
    }

    if (item.type === 'ticket') {
      return replyWithBox(
        interaction,
        [
          `🎟️ **${item.name}** will be used for future raffles.`,
          `You keep your ticket until a drawing happens.`,
        ].join('\n'),
        true
      );
    }

    return replyWithBox(
      interaction,
      'ℹ️ This item does not have a special use implemented yet.',
      true
    );
  }
});

// Start bot
client.login(TOKEN);
