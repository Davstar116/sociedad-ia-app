const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].split('\r')[0].trim().replace(/['"]/g, '');
});

async function test() {
  const NOTION_TOKEN = env.NOTION_TOKEN;
  
  async function getDbCols(dbEnvVar, label) {
     const dbId = env[dbEnvVar];
     if(!dbId) return console.log(label, 'No ID found for var:', dbEnvVar);
     const res = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
       headers: { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28' }
     });
     const data = await res.json();
     if(data.properties) {
         console.log(label, Object.keys(data.properties));
     } else {
         console.log(label, data);
     }
  }

  await getDbCols('NOTION_USERS_DB_ID', 'USUARIOS:');
  await getDbCols('NOTION_DATABASE_ID', 'CANDIDATOS:');
}
test();
