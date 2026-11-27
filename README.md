# Core BOT

A lightweight Discord moderation and utility bot built with [discord.js](https://discord.js.org) v14. All commands are slash commands and are restricted to server **Administrators**.

## Features

- **Moderation:** kick, ban, temporary ban, mute (timeout), warn, bulk message delete
- **Auto-reply triggers:** reply to a chosen word or phrase with a saved response
- **Messaging:** announcements, DMs with the sender shown, and anonymous DMs
- **Customisation:** change the embed colour, footer, banner image and thumbnail logo
- **Bot presence:** change the bot status and activity text without touching the code
- **Persistent settings:** customisation and presence are saved to `settings.json` and survive restarts

## Commands

### Moderation

| Command | Description |
|---|---|
| `/kick user [reason]` | Kick a member |
| `/ban user [reason]` | Permanently ban a member |
| `/tempban user time [reason]` | Temporarily ban a member |
| `/mute user time [reason]` | Mute (timeout) a member, up to 28 days |
| `/warn user [reason]` | Warn a member |
| `/clear amount` | Delete 1 to 100 messages |

Time format: `10m` = 10 minutes, `1h` = 1 hour, `1d` = 1 day, `7d` = 7 days (also `s` for seconds and `w` for weeks).

### Triggers

| Command | Description |
|---|---|
| `/trigger create name response` | Create an auto-reply trigger |
| `/trigger delete name` | Delete a trigger |
| `/trigger list` | List all triggers |

### Utility

| Command | Description |
|---|---|
| `/announce message` | Post an announcement embed in the current channel |
| `/dm user message` | Send a DM that shows who sent it |
| `/prvdm user message` | Send an anonymous DM |
| `/dhelp` | Show the command panel |

### Customisation

| Command | Description |
|---|---|
| `/image url` | Add a banner image to the panel (`off` to remove) |
| `/fvn url` | Set the thumbnail logo (`off` to remove) |
| `/line color` | Change the embed colour (hex, e.g. `#FF0000`) |
| `/ef text` | Edit the footer text (`reset` for the default) |
| `/estatus` | Set the bot status: Online, Idle, DND or Invisible |
| `/ebds text [type]` | Set the status text and activity type (Custom, Playing, Watching, Listening, Competing) |

The colour and footer apply to every embed the bot sends. The banner image and thumbnail appear on the `/dhelp` panel and on `/announce`.

## Setup

### Requirements

- Node.js 18 or newer
- A Discord bot application and its token from the [Discord Developer Portal](https://discord.com/developers/applications)

### 1. Create the bot

1. Create an application in the Developer Portal and add a bot to it.
2. Under **Bot → Privileged Gateway Intents**, enable:
   - **Message Content Intent** (needed for triggers)
   - **Server Members Intent**
3. Invite the bot with the `bot` and `applications.commands` scopes. It needs these permissions: Kick Members, Ban Members, Moderate Members, Manage Messages, Send Messages and Embed Links.

### 2. Install and run

```bash
git clone https://github.com/<your-username>/Core-BOT.git
cd Core-BOT
npm install
```

Set your token as an environment variable and start the bot:

```bash
# Linux / macOS
export TOKEN="your-bot-token"
node index.js

# Windows (PowerShell)
$env:TOKEN="your-bot-token"
node index.js
```

Slash commands are registered automatically in every server when the bot starts or joins a new server.

### Pterodactyl / hosting panels

Add `TOKEN` as an environment variable in the startup settings and use `index.js` as the main file. Keep `settings.json` in place so your customisation is not lost on restart.

## Configuration

Customisation is stored in `settings.json`, which the bot creates the first time you change a setting. You normally do not need to edit it by hand, because the commands above update it for you.

| Key | Default |
|---|---|
| `color` | `#6400FF` |
| `footer` | `Tome • Core` |
| `image` | none |
| `thumbnail` | none |
| `status` | `online` |
| `activityType` | `Custom` |
| `activityText` | `play.tome.fun \| 19132` |

## Notes and limitations

- Triggers and warnings are stored in memory only, so they are cleared when the bot restarts.
- Temporary bans use a timer, so a pending unban is lost if the bot restarts, and durations are capped at about 24.8 days.
- The bot checks that image URLs are valid `http` or `https` links but cannot confirm that the image actually loads. Use the preview shown after the command to check it.
- Never commit your bot token. If it is ever exposed, reset it in the Developer Portal.

## Contributing

Issues and pull requests are welcome.

## License

MIT
