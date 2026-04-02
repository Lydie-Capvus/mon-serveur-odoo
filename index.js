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

    // Sécurité pour récupérer la ville avec ou sans majuscule
    const villeRecue = data.Ville || data.ville || 'Non précisée';

    const common = xmlrpc.createSecureClient(`${ODOO_URL}/xmlrpc/2/common`);
    
    common.methodCall('authenticate', [DB, USER, PASS, {}], (err, uid) => {
        if (err || !uid) {
            console.error("ERREUR AUTH ODOO");
            return res.status(500).send("Auth echouee");
        }

        const models = xmlrpc.createSecureClient(`${ODOO_URL}/xmlrpc/2/object`);
        
        models.methodCall('execute_kw', [DB, uid, PASS, 'crm.lead', 'create', [{
            'name': `WIX: ${data.nom || ''} ${data.prenom || ''}`,
            'contact_name': `${data.nom || ''} ${data.prenom || ''}`,
            'email_from': data.email || '',
            'phone': String(data.whatsapp || data.telephone || ''),
            'description': `Ville: ${villeRecue}\nPays: ${data.pays || ''}\nMessage: ${data.message || ''}\nCatégorie: ${data.categorie || ''}`,
            'x_studio_source_du_prospect': 'Site Web',
            'type': 'opportunity',
            'lang_id': false
        }]], (err, result) => {
            if (err) {
                console.error("ERREUR CREATION ODOO :", err);
                return res.status(500).send("Erreur Odoo");
            }
            console.log("SUCCES : Lead cree avec l'ID", result);
            res.send({ success: true, id: result });
        });
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur prêt sur port ${PORT}`));
