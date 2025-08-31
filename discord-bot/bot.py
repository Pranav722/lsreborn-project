# File: discord-bot/bot.py

# =========================
# ====== CONFIG ONLY ======
# =========================
# Fill these values. Only this section needs editing.

BOT_TOKEN = "YOUR_BOT_TOKEN"

# Discord Server (Guild) and channels/roles
GUILD_ID = 1322660458888695818
TARGET_CHANNEL_ID = 1411033400541708339

# --- Role IDs ---
APPLICATION_ROLE_ID = 1409618880984252596
PREMIUM_APPLICANT_ROLE_ID = 1409618965914845286
WAITING_FOR_APPROVAL_ROLE_ID = 1411030428126675085
WHITELISTED_ROLE_ID = 1322674155107127458
COOLDOWN_ROLE_ID = 1411034610086842471

# MySQL connection
MYSQL_HOST = "lsreborn-db-lsreborn-project.d.aivencloud.com"
MYSQL_PORT = 26342
MYSQL_USER = "avnadmin"
MYSQL_PASSWORD = "AVNS_cKRmttkqfB5THos3bSX"
MYSQL_DATABASE = "defaultdb"

# Poll interval (seconds) for checking the database
POLL_SECONDS = 10

# Message templates
MESSAGE_TEMPLATES = {
    "accepted": {
        "title": "🎉 Application Approved",
        "description": "Congratulations {member_mention}, your application has been approved!",
        "color": 0x00FF00,
        "image_url": "https://media.discordapp.net/attachments/1322653001814376508/1326967048181645405/Accepted.png?ex=68b335de&is=68b1e45e&hm=647529993b01965fd652d1e6dd56f97686b77b7ecba4cad1fb15f57fa8acca47&"
    },
    "rejected": {
        "title": "🚫 Application Rejected",
        "description": "Hello {member_mention}, your application has been rejected.\nReason: {reason}",
        "color": 0xFF0000,
        "image_url": "https://media.discordapp.net/attachments/1322653001814376508/1326967049972355153/Rejected.png?ex=68b335de&is=68b1e45e&hm=4db37f953297c49356fbd0da089b53186b12d9ee63665d99bd3d68c767f1ab6e&"
    }
}

# =========================
# ====== BOT LOGIC ========
# =========================

import asyncio
import logging
import sys
from datetime import datetime, timedelta

import pymysql
import discord
from discord.ext import commands, tasks

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s", stream=sys.stdout)
log = logging.getLogger("app-bot")

intents = discord.Intents.default()
intents.members = True
bot = commands.Bot(command_prefix="!", intents=intents)

def db_connect():
    return pymysql.connect(host=MYSQL_HOST, port=MYSQL_PORT, user=MYSQL_USER, password=MYSQL_PASSWORD, database=MYSQL_DATABASE, autocommit=True, cursorclass=pymysql.cursors.DictCursor)

async def manage_roles(member, *, add_roles=None, remove_roles=None, reason=""):
    if not member: return
    if add_roles:
        await member.add_roles(*[r for r in add_roles if r], reason=reason)
    if remove_roles:
        await member.remove_roles(*[r for r in remove_roles if r], reason=reason)

async def resolve_member(guild, discord_id):
    member = guild.get_member(discord_id)
    if member is None:
        try:
            member = await guild.fetch_member(discord_id)
        except discord.NotFound:
            return None
    return member

@tasks.loop(seconds=POLL_SECONDS)
async def check_new_submissions():
    await bot.wait_until_ready()
    guild = bot.get_guild(GUILD_ID)
    if not guild: return

    conn = db_connect()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM applications WHERE status = 'pending' AND notified = 0")
            for row in cur.fetchall():
                discord_id = int(row['discordId'])
                member = await resolve_member(guild, discord_id)
                if not member: continue

                log.info(f"Processing new submission from {member.name}...")
                
                app_role = guild.get_role(APPLICATION_ROLE_ID)
                prem_app_role = guild.get_role(PREMIUM_APPLICANT_ROLE_ID)
                waiting_role = guild.get_role(WAITING_FOR_APPROVAL_ROLE_ID)
                
                original_role_id = None
                if prem_app_role in member.roles:
                    original_role_id = PREMIUM_APPLICANT_ROLE_ID
                elif app_role in member.roles:
                    original_role_id = APPLICATION_ROLE_ID

                # Update or create user record in discord_users table
                cur.execute(
                    "INSERT INTO discord_users (discord_id, username, original_applicant_role_id) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE username=%s, original_applicant_role_id=%s",
                    (str(discord_id), member.name, str(original_role_id), member.name, str(original_role_id))
                )

                await manage_roles(member, add_roles=[waiting_role], remove_roles=[app_role, prem_app_role], reason="Application Submitted")
                
                cur.execute("UPDATE applications SET notified = 1 WHERE id = %s", (row['id'],))
    finally:
        conn.close()

@tasks.loop(seconds=POLL_SECONDS)
async def check_final_decisions():
    await bot.wait_until_ready()
    guild = bot.get_guild(GUILD_ID)
    channel = bot.get_channel(TARGET_CHANNEL_ID)
    if not guild or not channel: return

    conn = db_connect()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM applications WHERE status IN ('approved', 'rejected') AND notified = 0")
            for row in cur.fetchall():
                discord_id = int(row['discordId'])
                member = await resolve_member(guild, discord_id)
                if not member: continue

                status = row['status']
                log.info(f"Processing '{status}' decision for {member.name}...")

                waiting_role = guild.get_role(WAITING_FOR_APPROVAL_ROLE_ID)
                
                if status == 'approved':
                    whitelisted_role = guild.get_role(WHITELISTED_ROLE_ID)
                    await manage_roles(member, add_roles=[whitelisted_role], remove_roles=[waiting_role], reason="Application Approved")
                    embed = discord.Embed.from_dict(MESSAGE_TEMPLATES['accepted'])
                    embed.description = MESSAGE_TEMPLATES['accepted']['description'].format(member_mention=member.mention)
                else: # Rejected
                    cooldown_role = guild.get_role(COOLDOWN_ROLE_ID)
                    await manage_roles(member, add_roles=[cooldown_role], remove_roles=[waiting_role], reason="Application Rejected")
                    
                    cooldown_hours = 24 # Or get from DB if you store it
                    expiry_time = datetime.utcnow() + timedelta(hours=cooldown_hours)
                    cur.execute("UPDATE discord_users SET cooldown_expiry = %s WHERE discord_id = %s", (expiry_time, str(discord_id)))
                    
                    embed = discord.Embed.from_dict(MESSAGE_TEMPLATES['rejected'])
                    embed.description = MESSAGE_TEMPLATES['rejected']['description'].format(member_mention=member.mention, reason=row['reason'])

                await channel.send(embed=embed)
                cur.execute("UPDATE applications SET notified = 1 WHERE id = %s", (row['id'],))
    finally:
        conn.close()

@tasks.loop(minutes=5)
async def check_cooldowns():
    await bot.wait_until_ready()
    guild = bot.get_guild(GUILD_ID)
    if not guild: return

    conn = db_connect()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM discord_users WHERE cooldown_expiry IS NOT NULL AND cooldown_expiry < NOW()")
            for row in cur.fetchall():
                discord_id = int(row['discord_id'])
                member = await resolve_member(guild, discord_id)
                if not member: continue

                log.info(f"Cooldown expired for {member.name}. Re-granting applicant role.")
                
                cooldown_role = guild.get_role(COOLDOWN_ROLE_ID)
                original_app_role = guild.get_role(int(row['original_applicant_role_id']))

                await manage_roles(member, add_roles=[original_app_role], remove_roles=[cooldown_role], reason="Cooldown Expired")
                
                cur.execute("UPDATE discord_users SET cooldown_expiry = NULL WHERE discord_id = %s", (str(discord_id),))
    finally:
        conn.close()

@bot.event
async def on_ready():
    log.info(f"Logged in as {bot.user}")
    check_new_submissions.start()
    check_final_decisions.start()
    check_cooldowns.start()

bot.run(BOT_TOKEN)