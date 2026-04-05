const NOTION_TOKEN = process.env.NOTION_TOKEN;
const USERS_DB_ID = process.env.NOTION_USERS_DB_ID;
const CAN_DB_ID = process.env.NOTION_DATABASE_ID;

const NOTION_API = 'https://api.notion.com/v1/databases';
const headers = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json'
};

const updateUsers = async () => {
    const body = {
        properties: {
            "Cargo": {
                "select": {
                    "options": [
                        { name: "Proyectos", color: "blue" },
                        { name: "Difusión", color: "red" },
                        { name: "Capacitación", color: "green" },
                        { name: "Organización", color: "orange" },
                        { name: "Vicepresidente", color: "purple" },
                        { name: "Presidente", color: "yellow" }
                    ]
                }
            }
        }
    };
    const res = await fetch(`${NOTION_API}/${USERS_DB_ID}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
    const data = await res.json();
    if(res.ok) console.log("Usuarios update: OK");
    else console.log("Usuarios error:", data);
}

const updateCandidatos = async () => {
    const votacionOptions = [
        { name: "Pendiente", color: "gray" },
        { name: "Aprobar", color: "green" },
        { name: "Rechazar", color: "red" }
    ];
    
    const body = {
        properties: {
            "Núcleo Evaluador": {
                 "select": {
                     "options": [
                         { name: "Proyectos", color: "blue" },
                         { name: "Difusión", color: "red" },
                         { name: "Capacitación", color: "green" },
                         { name: "Organización", color: "orange" }
                     ]
                 }
            },
            "Voto Pre Lider": { select: { options: votacionOptions } },
            "Voto Pre VP": { select: { options: votacionOptions } },
            "Voto Pre Presi": { select: { options: votacionOptions } },
            "Voto Final Lider": { select: { options: votacionOptions } },
            "Voto Final VP": { select: { options: votacionOptions } },
            "Voto Final Presi": { select: { options: votacionOptions } }
        }
    };
    const res = await fetch(`${NOTION_API}/${CAN_DB_ID}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
    const data = await res.json();
    if(res.ok) console.log("Candidatos update: OK");
    else console.log("Candidatos error:", data);
}

async function run() {
    await updateUsers();
    await updateCandidatos();
}

run();
