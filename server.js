const Discord = require("discord.js");
const client = new Discord.Client();
const ayar = require("./Settings/ayarlar.json");
const k = require("./Settings/idler.json");
const s = require("./Settings/koruma.json");
const fs = require("fs");
const moment = require("moment");
const db = require ("quick.db");
const express = require("express");
const http = require("http");

//----------------------------\\7-24 Tutma//----------------------------\\

const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping tamamdır.");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

//----------------------------\\ELLEME BURAYI//----------------------------\\

function guvenli(kisiID) {
  let uye = client.guilds.cache.get(k.sunucu).members.cache.get(kisiID);
  let guvenliler = ayar.whitelist || [];
  ayar.whitelist = guvenliler;

  if (
    !uye ||
    uye.id === client.user.id ||
    uye.id === ayar.owner ||
    uye.id === uye.guild.owner.id ||
    guvenliler.some(
      g => uye.id === g.slice(1) || uye.roles.cache.has(g.slice(1))
    )
  )
    return true;
  else return false;
}

const yetkiPermleri = [
  "ADMINISTRATOR",
  "MANAGE_ROLES",
  "MANAGE_CHANNELS",
  "MANAGE_GUILD",
  "BAN_MEMBERS",
  "KICK_MEMBERS",
  "MANAGE_NICKNAMES",
  "MANAGE_EMOJIS",
  "MANAGE_WEBHOOKS"
];
function cezalandir(kisiID, tur) {
  let uye = client.guilds.cache.get(k.sunucu).members.cache.get(kisiID);
  if (!uye) return;
  if (tur == "cezalandır")

  return uye.roles.cache.has(k.booster)
    ? uye.roles.set([k.booster, k.cezalı])
    : uye.roles.set([k.cezalı]);
}

//----------------------------\\Sağ Tık Kick Koruması//----------------------------\\
//----------------------------\\Rol Silme Koruması//----------------------------\\

client.on("roleDelete", async role => {
  let yetkili = await role.guild
    .fetchAuditLogs({ type: "ROLE_DELETE" })
    .then(audit => audit.entries.first());
  if (
    !yetkili ||
    !yetkili.executor ||
    Date.now() - yetkili.createdTimestamp > 5000 ||
    guvenli(yetkili.executor.id) ||
    !s.rolkoruma
  )
    return;
  cezalandir(yetkili.executor.id, "cezalandır");

  let logKanali = client.channels.cache.get(k.log);
  if (logKanali) {
    logKanali
      .send(
        new Discord.MessageEmbed()
          .setColor("#19c400")
          .setDescription(
            `${yetkili.executor}(\`${
              yetkili.executor.id
            }\`) tarafından **\`${new Date().toTurkishFormatDate()}\`** zamanında **bir rol silindi**. Yetkiliyi **jaile attım**.`
          )
      )
      .catch();
  }
});

//----------------------------\\Kullanıcı Rollerini Değiştirme Koruması//----------------------------\\

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  if (newMember.roles.cache.size > oldMember.roles.cache.size) {
    let yetkili = await newMember.guild
      .fetchAuditLogs({ type: "MEMBER_ROLE_UPDATE" })
      .then(audit => audit.entries.first());
    if (
      !yetkili ||
      !yetkili.executor ||
      Date.now() - yetkili.createdTimestamp > 5000 ||
      guvenli(yetkili.executor.id) ||
      !s.rolkoruma
    )
      return;
    if (
      yetkiPermleri.some(
        p => !oldMember.hasPermission(p) && newMember.hasPermission(p)
      )
    ) {
      cezalandir(yetkili.executor.id, "cezalandır");
      newMember.roles.set(oldMember.roles.cache.map(r => r.id));
      let logKanali = client.channels.cache.get(k.log);
      if (logKanali) {
        logKanali
          .send(
            new Discord.MessageEmbed()
              .setColor("#19c400")
              .setDescription(
                `${yetkili.executor}(\`${
                  yetkili.executor.id
                }\`) tarafından **\`${new Date().toTurkishFormatDate()}\`** zamanında ${newMember}(\`${
                  newMember.id
                }\`) adlı kullanıcıya **rol verdi**. **Verilen rol kullanıcıdan alınıp**, yetkiliyi **jaile attım**.`
              )
          )
          .catch();
      }
    }
  }
});
//----------------------------\\Rol Oluşturma Koruması//----------------------------\\
client.on('ready', ()=>{
client.channels.cache.get('838739966175084554').join()
})
client.on("roleCreate", async role => {
  let yetkili = await role.guild
    .fetchAuditLogs({ type: "ROLE_CREATE" })
    .then(audit => audit.entries.first());
  if (
    !yetkili ||
    !yetkili.executor ||
    Date.now() - yetkili.createdTimestamp > 5000 ||
    guvenli(yetkili.executor.id) ||
    !s.rolkoruma
  )
    return;
  role.delete({ reason: "Rol Koruma" });
  cezalandir(yetkili.executor.id, "cezalandır");
  let logKanali = client.channels.cache.get(k.log);
  if (logKanali) {
    logKanali
      .send(
        new Discord.MessageEmbed()
          .setColor("#19c400")
          .setDescription(
            `${yetkili.executor}(\`${
              yetkili.executor.id
            }\`) tarafından **\`${new Date().toTurkishFormatDate()}\`** zamanında **bir rol oluşturuldu**. **Açılan rolü silip**, yetkiliyi **jaile attım**.`
          )
      )
      .catch();
  }
});

//----------------------------\\Botun Durumu//----------------------------\\

client.on("ready", async () => {
  client.user.setPresence({ activity: { name: "Akirâ ❤️ qmi" }, status: "dnd" });
});

//----------------------------\\Token//----------------------------\\

client
  .login(process.env.token)
  .then(c => console.log(`${client.user.tag} olarak giriş yapıldı!`))
  .catch(err => console.error("Botun tokenini kontrol ediniz!"));

//----------------------------\\Zaman Tanımlama//----------------------------\\

Date.prototype.toTurkishFormatDate = function(format) {
  let date = this,
    day = date.getDate(),
    weekDay = date.getDay(),
    month = date.getMonth(),
    year = date.getFullYear(),
    hours = date.getHours(),
    minutes = date.getMinutes(),
    seconds = date.getSeconds();

  let monthNames = new Array(
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık"
  );
  let dayNames = new Array(
    "Pazar",
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma",
    "Cumartesi"
  );

  if (!format) {
    format = "dd MM yyyy | hh:ii:ss";
  }
  format = format.replace("mm", month.toString().padStart(2, "0"));
  format = format.replace("MM", monthNames[month]);

  if (format.indexOf("yyyy") > -1) {
    format = format.replace("yyyy", year.toString());
  } else if (format.indexOf("yy") > -1) {
    format = format.replace("yy", year.toString().substr(2, 2));
  }

  format = format.replace("dd", day.toString().padStart(2, "0"));
  format = format.replace("DD", dayNames[weekDay]);

  if (format.indexOf("HH") > -1)
    format = format.replace("HH", hours.toString().replace(/^(\d)$/, "0$1"));
  if (format.indexOf("hh") > -1) {
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    format = format.replace("hh", hours.toString().replace(/^(\d)$/, "0$1"));
  }
  if (format.indexOf("ii") > -1)
    format = format.replace("ii", minutes.toString().replace(/^(\d)$/, "0$1"));
  if (format.indexOf("ss") > -1)
    format = format.replace("ss", seconds.toString().replace(/^(\d)$/, "0$1"));
  return format;
};

client.tarihHesapla = date => {
  const startedAt = Date.parse(date);
  var msecs = Math.abs(new Date() - startedAt);

  const years = Math.floor(msecs / (1000 * 60 * 60 * 24 * 365));
  msecs -= years * 1000 * 60 * 60 * 24 * 365;
  const months = Math.floor(msecs / (1000 * 60 * 60 * 24 * 30));
  msecs -= months * 1000 * 60 * 60 * 24 * 30;
  const weeks = Math.floor(msecs / (1000 * 60 * 60 * 24 * 7));
  msecs -= weeks * 1000 * 60 * 60 * 24 * 7;
  const days = Math.floor(msecs / (1000 * 60 * 60 * 24));
  msecs -= days * 1000 * 60 * 60 * 24;
  const hours = Math.floor(msecs / (1000 * 60 * 60));
  msecs -= hours * 1000 * 60 * 60;
  const mins = Math.floor(msecs / (1000 * 60));
  msecs -= mins * 1000 * 60;
  const secs = Math.floor(msecs / 1000);
  msecs -= secs * 1000;

  var string = "";
  if (years > 0) string += `${years} yıl ${months} ay`;
  else if (months > 0)
    string += `${months} ay ${weeks > 0 ? weeks + " hafta" : ""}`;
  else if (weeks > 0)
    string += `${weeks} hafta ${days > 0 ? days + " gün" : ""}`;
  else if (days > 0)
    string += `${days} gün ${hours > 0 ? hours + " saat" : ""}`;
  else if (hours > 0)
    string += `${hours} saat ${mins > 0 ? mins + " dakika" : ""}`;
  else if (mins > 0)
    string += `${mins} dakika ${secs > 0 ? secs + " saniye" : ""}`;
  else if (secs > 0) string += `${secs} saniye`;
  else string += `saniyeler`;

  string = string.trim();
  return `\`${string} önce\``;
};