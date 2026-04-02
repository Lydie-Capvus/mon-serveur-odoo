const express = require('express');
const cors = require('cors');
const xmlrpc = require('xmlrpc');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/odoo-lead', (req, res) => {
    const data = req.body;
    console.log("RECU DE WIX :", JSON.stringify(data, null, 2));

    const ODOO_URL = 'https://techultra-solutions-boosttotal.odoo.com';
    const DB = 'techultra-solutions-boosttotal-live-29673368';
    const USER = 'recruteurgpe.prodcapvus@gmail.com'; 
    const PASS = '7e30aff65dd971e72b4a17eca2550fc5f4d61f85';

    // On prépare une description qui regroupe TOUT ce qui n'est pas standard
    const villeRecue = data.Ville || data.ville || 'Non précisée';
    const paysRecu = data.pays || 'Non précisé';
    const categorieRecue = data.categorie || 'Non précisée';
    
    const descriptionComplete = `
INFOS COMPLÉMENTAIRES :
----------------------
Ville : ${villeRecue}
Pays : ${paysRecu}
Catégorie : ${categorieRecue}
Message : ${data.message || ''}
Source : Site Web (Wix)
    `.trim();

    const common = xmlrpc.createSecureClient(`${ODOO_URL}/xmlrpc/2/common`);
    
    common.methodCall('authenticate', [DB, USER, PASS, {}], (err, uid) => {
        if (err || !uid) return res.status(500).send("Auth echouee");

        const models = xmlrpc.createSecureClient(`${ODOO_URL}/xmlrpc/2/object`);
        
        // On n'envoie que les champs de base qui existent TOUJOURS dans Odoo
        models.methodCall('execute_kw', [DB, uid, PASS, 'crm.lead', 'create', [{
            'name': `WIX: ${data.nom || ''} ${data.prenom || ''}`,
            'contact_name': `${data.nom || ''} ${data.prenom || ''}`,
            'email_from': data.email || '',
            'phone': String(data.whatsapp || data.telephone || ''),
            'description': descriptionComplete,
            'type': 'opportunity',
            'lang_id': false
        }]], (err, result) => {
            if (err) {
                console.error("ERREUR ODOO :", err);
                return res.status(500).send("Erreur Odoo");
            }
            console.log("SUCCES TOTAL : Lead cree avec l'ID", result);
            res.send({ success: true, id: result });
        });
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur prêt`));
