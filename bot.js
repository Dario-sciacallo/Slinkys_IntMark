const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const https = require('https');
const { initDB, getDB, saveDB } = require('./db');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const TORN_API_BASE = 'https://api.torn.com/user';

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('Set DISCORD_TOKEN and CLIENT_ID environment variables');
  process.exit(1);
}

function fetchTornUser(apiKey) {
  return new Promise((resolve, reject) => {
    const url = TORN_API_BASE + '?selections=basic&key=' + apiKey;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.error || 'Invalid API key'));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error('Failed to parse Torn API response'));
        }
      });
    }).on('error', reject);
  });
}

const commands = [
  new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register your Torn account with SLYNKY INTMARKET')
    .addStringOption(opt =>
      opt.setName('apikey')
        .setDescription('Your Torn API key')
        .setRequired(true)
    ),
];

async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map(c => c.toJSON()) });
    console.log('Slash commands registered');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
}

async function handleRegister(interaction) {
  const apiKey = interaction.options.getString('apikey');
  const discordId = interaction.user.id;
  const discordTag = interaction.user.tag;

  await interaction.deferReply({ ephemeral: true });

  try {
    const tornData = await fetchTornUser(apiKey);
    const tornId = String(tornData.player_id);
    const tornName = tornData.name;

    const db = getDB();

    const existing = db.exec("SELECT id FROM [user] WHERE discord_id = '" + discordId + "' OR torn_id = '" + tornId + "'");
    if (existing.length > 0 && existing[0].values.length > 0) {
      await interaction.editReply('This Discord account or Torn player is already registered.');
      return;
    }

    db.run(
      'INSERT INTO [user] (discord_id, torn_id, torn_name, api_key_encrypted, last_inventory_sync) VALUES (?, ?, ?, ?, datetime(\'now\'))',
      [discordId, tornId, tornName, apiKey]
    );
    saveDB();

    await interaction.editReply(
      'Registration successful!\n' +
      '**Torn Name:** ' + tornName + '\n' +
      '**Torn ID:** ' + tornId + '\n' +
      'Welcome to SLYNKY INTMARKET!'
    );
  } catch (err) {
    await interaction.editReply('Registration failed: ' + err.message);
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log('Bot online as ' + client.user.tag);
  await deployCommands();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'register') {
    await handleRegister(interaction);
  }
});

initDB().then(() => {
  client.login(DISCORD_TOKEN);
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
