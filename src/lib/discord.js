export async function fetchDiscordUser(userId) {
  if (!process.env.DISCORD_TOKEN) {
    console.error("DISCORD_TOKEN is not defined in environment variables");
    return null;
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      if (res.status === 429) {
        console.warn("Discord API rate limited");
      }
      return null;
    }

    const data = await res.json();
    return {
      username: data.global_name || data.username,
      avatar_url: data.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${data.avatar}.png` : null
    };
  } catch (e) {
    console.error(`Failed to fetch Discord user ${userId}:`, e);
    return null;
  }
}
