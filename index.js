const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  InteractionContextType,
  MessageFlags,
  ActivityType
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // triggers ke liye zaroori hai
    GatewayIntentBits.GuildMembers
  ]
});

const COLOR = 0x6400FF;
const warnings = new Map();
const triggers = new Map(); // name (lowercase) -> response

// ================= SLASH COMMAND DEFINITIONS =================
const adminOnly = (b) =>
  b
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild);

const commands = [
  adminOnly(
    new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick a member')
      .addUserOption((o) => o.setName('user').setDescription('Member to kick').setRequired(true))
      .addStringOption((o) => o.setName('reason').setDescription('Reason'))
  ),
  adminOnly(
    new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Permanently ban a member')
      .addUserOption((o) => o.setName('user').setDescription('Member to ban').setRequired(true))
      .addStringOption((o) => o.setName('reason').setDescription('Reason'))
  ),
  adminOnly(
    new SlashCommandBuilder()
      .setName('tempban')
      .setDescription('Temporarily ban a member')
      .addUserOption((o) => o.setName('user').setDescription('Member to ban').setRequired(true))
      .addStringOption((o) =>
        o.setName('time').setDescription('Duration e.g. 10m, 1h, 7d').setRequired(true)
      )
      .addStringOption((o) => o.setName('reason').setDescription('Reason'))
  ),
  adminOnly(
    new SlashCommandBuilder()
      .setName('mute')
      .setDescription('Mute (timeout) a member')
      .addUserOption((o) => o.setName('user').setDescription('Member to mute').setRequired(true))
      .addStringOption((o) =>
        o.setName('time').setDescription('Duration e.g. 10m, 1h, 1d').setRequired(true)
      )
      .addStringOption((o) => o.setName('reason').setDescription('Reason'))
  ),
  adminOnly(
    new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Warn a member')
      .addUserOption((o) => o.setName('user').setDescription('Member to warn').setRequired(true))
      .addStringOption((o) => o.setName('reason').setDescription('Reason'))
  ),
  adminOnly(
    new SlashCommandBuilder()
      .setName('clear')
      .setDescription('Delete messages (1-100)')
      .addIntegerOption((o) =>
        o
          .setName('amount')
          .setDescription('Number of messages')
          .setMinValue(1)
          .setMaxValue(100)
          .setRequired(true)
      )
  ),
  adminOnly(
    new SlashCommandBuilder()
      .setName('announce')
      .setDescription('Make an announcement')
      .addStringOption((o) =>
        o.setName('message').setDescription('Announcement text').setRequired(true)
      )
  ),
  adminOnly(
    new SlashCommandBuilder()
      .setName('trigger')
      .setDescription('Manage auto-reply triggers')
      .addSubcommand((s) =>
        s
          .setName('create')
          .setDescription('Create a trigger')
          .addStringOption((o) => o.setName('name').setDescription('Trigger word').setRequired(true))
          .addStringOption((o) =>
            o.setName('response').setDescription('Bot response').setRequired(true)
          )
      )
      .addSubcommand((s) =>
        s
          .setName('delete')
          .setDescription('Delete a trigger')
          .addStringOption((o) => o.setName('name').setDescription('Trigger word').setRequired(true))
      )
      .addSubcommand((s) => s.setName('list').setDescription('List all triggers'))
  ),
  adminOnly(
    new SlashCommandBuilder()
      .setName('dm')
      .setDescription('Send a DM to a member')
      .addUserOption((o) => o.setName('user').setDescription('Member to DM').setRequired(true))
      .addStringOption((o) => o.setName('message').setDescription('Message').setRequired(true))
  ),
  adminOnly(
    new SlashCommandBuilder()
      .setName('prvdm')
      .setDescription('Send an anonymous DM (sender name hidden)')
      .addUserOption((o) => o.setName('user').setDescription('Member to DM').setRequired(true))
      .addStringOption((o) => o.setName('message').setDescription('Message').setRequired(true))
  ),
  adminOnly(new SlashCommandBuilder().setName('dhelp').setDescription('Show bot commands'))
].map((c) => c.toJSON());

async function registerCommands(guild) {
  try {
    await guild.commands.set(commands);
    console.log(`📌 Slash commands registered in: ${guild.name}`);
  } catch (err) {
    console.error(`Failed to register commands in ${guild.name}:`, err.message);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  // Bot status (change the text below anytime)
  client.user.setPresence({
    status: 'online', // online | idle | dnd
    activities: [{ name: 'Custom Status', type: ActivityType.Custom, state: 'play.diesiremc.fun | 19132' }]
  });
  for (const guild of client.guilds.cache.values()) await registerCommands(guild);
});

client.on(Events.GuildCreate, registerCommands);

// ================= HELPERS =================
function parseTime(time) {
  if (!time) return null;
  const match = time.match(/^(\d+)(s|m|h|d|w)$/i);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  };
  return value * multipliers[unit];
}

async function sendDM(user, title, fields) {
  try {
    const embed = new EmbedBuilder()
      .setColor(COLOR)
      .setTitle(title)
      .addFields(fields)
      .setTimestamp();
    await user.send({ embeds: [embed] });
  } catch (err) {}
}

function modEmbed(title, interaction, user, extra = [], reason) {
  const fields = [
    { name: 'User', value: `${user.tag}`, inline: true },
    { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
    ...extra
  ];
  if (reason !== undefined) fields.push({ name: 'Reason', value: reason });
  return new EmbedBuilder().setColor(COLOR).setTitle(title).addFields(fields).setTimestamp();
}

// ================= TRIGGERS (normal messages, no prefix) =================
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;
  const content = message.content.trim().toLowerCase();
  if (triggers.has(content)) {
    await message.channel.send(triggers.get(content));
  }
});

// ================= SLASH COMMAND HANDLER =================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || !interaction.guild) return;

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ This command can only be used by **Administrators**.',
      flags: MessageFlags.Ephemeral
    });
  }

  const cmd = interaction.commandName;
  const fail = (msg) => {
    const payload = { content: msg, flags: MessageFlags.Ephemeral };
    return interaction.deferred || interaction.replied
      ? interaction.editReply({ content: msg })
      : interaction.reply(payload);
  };

  try {
    // ---------- KICK ----------
    if (cmd === 'kick') {
      const member = interaction.options.getMember('user');
      if (!member) return fail('❌ User is not in this server.');
      if (!member.kickable) return fail('❌ I cannot kick this user.');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      await interaction.deferReply();
      await member.kick(reason);
      await interaction.editReply({ embeds: [modEmbed('Member Kicked', interaction, member.user, [], reason)] });
      await sendDM(member.user, 'You have been kicked', [
        { name: 'Server', value: interaction.guild.name },
        { name: 'Reason', value: reason }
      ]);
    }

    // ---------- BAN ----------
    else if (cmd === 'ban') {
      const member = interaction.options.getMember('user');
      if (!member) return fail('❌ User is not in this server.');
      if (!member.bannable) return fail('❌ I cannot ban this user.');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      await interaction.deferReply();
      // DM pehle bhejo, kyunki ban ke baad DM nahi ja sakta
      await sendDM(member.user, 'You have been banned', [
        { name: 'Server', value: interaction.guild.name },
        { name: 'Reason', value: reason }
      ]);
      await member.ban({ reason });
      await interaction.editReply({ embeds: [modEmbed('Member Banned', interaction, member.user, [], reason)] });
    }

    // ---------- TEMPBAN ----------
    else if (cmd === 'tempban') {
      const member = interaction.options.getMember('user');
      if (!member) return fail('❌ User is not in this server.');
      if (!member.bannable) return fail('❌ I cannot ban this user.');
      const time = interaction.options.getString('time');
      const duration = parseTime(time);
      if (!duration) return fail('❌ Please provide a valid time. Example: `1m`, `1h`, `1d`, `7d`');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      await interaction.deferReply();
      await sendDM(member.user, 'You have been temporarily banned', [
        { name: 'Server', value: interaction.guild.name },
        { name: 'Duration', value: time },
        { name: 'Reason', value: reason }
      ]);
      await member.ban({ reason: `[TempBan ${time}] ${reason}` });
      await interaction.editReply({
        embeds: [modEmbed('Member Temporarily Banned', interaction, member.user, [{ name: 'Duration', value: time, inline: true }], reason)]
      });
      const channel = interaction.channel;
      const guild = interaction.guild;
      const userId = member.id;
      const tag = member.user.tag;
      // NOTE: setTimeout max ~24.8 din tak chalta hai
      setTimeout(async () => {
        try {
          await guild.members.unban(userId, 'Tempban duration ended');
          channel.send(`✅ **${tag}**'s temporary ban has ended.`);
        } catch (e) {}
      }, Math.min(duration, 2147483647));
    }

    // ---------- MUTE ----------
    else if (cmd === 'mute') {
      const member = interaction.options.getMember('user');
      if (!member) return fail('❌ User is not in this server.');
      if (!member.moderatable) return fail('❌ I cannot mute this user.');
      const time = interaction.options.getString('time');
      const duration = parseTime(time);
      if (!duration) return fail('❌ Please provide a valid time. Example: `10m`, `1h`, `1d`');
      if (duration > 28 * 24 * 60 * 60 * 1000) return fail('❌ Maximum mute duration is 28 days.');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      await interaction.deferReply();
      await member.timeout(duration, reason);
      await interaction.editReply({
        embeds: [modEmbed('Member Muted', interaction, member.user, [{ name: 'Duration', value: time, inline: true }], reason)]
      });
      await sendDM(member.user, 'You have been muted', [
        { name: 'Server', value: interaction.guild.name },
        { name: 'Duration', value: time },
        { name: 'Reason', value: reason }
      ]);
    }

    // ---------- WARN ----------
    else if (cmd === 'warn') {
      const member = interaction.options.getMember('user');
      if (!member) return fail('❌ User is not in this server.');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      if (!warnings.has(member.id)) warnings.set(member.id, []);
      warnings.get(member.id).push({
        reason,
        moderator: interaction.user.tag,
        date: new Date().toLocaleString()
      });
      const count = warnings.get(member.id).length;
      await interaction.reply({
        embeds: [modEmbed('Member Warned', interaction, member.user, [{ name: 'Total Warnings', value: `${count}`, inline: true }], reason)]
      });
      await sendDM(member.user, 'You have been warned', [
        { name: 'Server', value: interaction.guild.name },
        { name: 'Reason', value: reason },
        { name: 'Total Warnings', value: `${count}` }
      ]);
    }

    // ---------- CLEAR ----------
    else if (cmd === 'clear') {
      const amount = interaction.options.getInteger('amount');
      if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageMessages)) {
        return fail('❌ I need the **Manage Messages** permission to delete messages.');
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        const deleted = await interaction.channel.bulkDelete(amount, true);
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLOR)
              .setDescription(`✅ Successfully deleted **${deleted.size}** message(s).`)
              .setTimestamp()
          ]
        });
      } catch (err) {
        console.error(err);
        await interaction.editReply('❌ Failed to delete messages. Make sure the messages are not older than 14 days.');
      }
    }

    // ---------- ANNOUNCE ----------
    else if (cmd === 'announce') {
      const text = interaction.options.getString('message');
      const embed = new EmbedBuilder().setColor(COLOR).setTitle('Announcement').setDescription(text);
      await interaction.channel.send({ embeds: [embed] });
      await interaction.reply({ content: '✅ Announcement sent.', flags: MessageFlags.Ephemeral });
    }

    // ---------- TRIGGER ----------
    else if (cmd === 'trigger') {
      const sub = interaction.options.getSubcommand();

      if (sub === 'create') {
        const name = interaction.options.getString('name');
        const response = interaction.options.getString('response');
        triggers.set(name.trim().toLowerCase(), response);
        const embed = new EmbedBuilder()
          .setColor(COLOR)
          .setTitle('Trigger Created')
          .addFields(
            { name: 'Trigger', value: `\`${name}\``, inline: true },
            { name: 'Response', value: response }
          )
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } else if (sub === 'delete') {
        const name = interaction.options.getString('name');
        const key = name.trim().toLowerCase();
        if (!triggers.has(key)) return fail(`❌ Trigger \`${name}\` does not exist.`);
        triggers.delete(key);
        const embed = new EmbedBuilder()
          .setColor(COLOR)
          .setTitle('Trigger Deleted')
          .setDescription(`Trigger \`${name}\` has been removed.`)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
      } else if (sub === 'list') {
        if (triggers.size === 0) return fail('No triggers set yet.');
        const list = [...triggers.entries()].map(([n, r]) => `• **${n}** → ${r}`).join('\n');
        const embed = new EmbedBuilder()
          .setColor(COLOR)
          .setTitle('Active Triggers')
          .setDescription(list.slice(0, 4000))
          .setFooter({ text: `${triggers.size} trigger(s)` })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
      }
    }

    // ---------- DM (ab sender ka naam bhi jata hai) ----------
    else if (cmd === 'dm') {
      const user = interaction.options.getUser('user');
      const text = interaction.options.getString('message');
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        const embed = new EmbedBuilder()
          .setColor(COLOR)
          .setTitle(`Message from ${interaction.guild.name}`)
          .setDescription(text)
          .addFields({
            name: 'Sent by',
            value: `${interaction.user.tag} (${interaction.member?.displayName ?? interaction.user.username})`
          })
          .setFooter({
            text: `Sent by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();
        await user.send({ embeds: [embed] });
        await interaction.editReply(`✅ DM sent to **${user.tag}**.`);
      } catch (err) {
        await interaction.editReply('❌ Could not DM this user. Their DMs might be closed.');
      }
    }

    // ---------- PRVDM (anonymous: sirf message, sender ka naam nahi) ----------
    else if (cmd === 'prvdm') {
      const user = interaction.options.getUser('user');
      const text = interaction.options.getString('message');
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        const embed = new EmbedBuilder()
          .setColor(COLOR)
          .setTitle(`Message from ${interaction.guild.name}`)
          .setDescription(text)
          .setTimestamp(); // Discord khud "Today at / Yesterday at 22:44" dikhata hai
        await user.send({ embeds: [embed] });
        await interaction.editReply(`✅ Private DM sent to **${user.tag}**.`);
      } catch (err) {
        await interaction.editReply('❌ Could not DM this user. Their DMs might be closed.');
      }
    }

    // ---------- HELP ----------
    else if (cmd === 'dhelp') {
      const embed = new EmbedBuilder()
        .setColor(COLOR)
        .setTitle('Bot Commands')
        .setDescription('Only **Administrators** can use these commands.')
        .addFields(
          {
            name: 'Moderation',
            value: [
              '`/kick user [reason]` - Kick a member',
              '`/ban user [reason]` - Permanently ban a member',
              '`/tempban user time [reason]` - Temporarily ban a member',
              '`/mute user time [reason]` - Mute a member',
              '`/warn user [reason]` - Warn a member'
            ].join('\n')
          },
          {
            name: 'Triggers',
            value: [
              '`/trigger create name response` - Create auto-reply trigger',
              '`/trigger delete name` - Delete a trigger',
              '`/trigger list` - List all triggers'
            ].join('\n')
          },
          {
            name: 'Utility',
            value: [
              '`/announce message` - Make an announcement',
              '`/dm user message` - Send a DM to a member (shows sender)',
              '`/prvdm user message` - Send an anonymous DM (sender hidden)',
              '`/clear amount` - Delete messages (1–100)',
              '`/dhelp` - Show this message'
            ].join('\n')
          },
          {
            name: 'Time Examples',
            value: '`10m` = 10 minutes | `1h` = 1 hour | `1d` = 1 day | `7d` = 7 days'
          }
        )
        .setFooter({ text: 'DiesireMC • Core' });
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  } catch (err) {
    console.error(err);
    try {
      await fail('❌ Something went wrong while running this command.');
    } catch (e) {}
  }
});

// Token ko TOKEN environment variable mein rakho (ya yahan naya token daalo)
client.login(process.env.TOKEN || 'YOUR_NEW_TOKEN_HERE');
