const express = require('express');
const cors = require('cors');
const xmlrpc = require('xmlrpc');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/odoo-lead', (req, res) => {
    const data = req.body;

    const ODOO_URL = 'https://techultra-solutions-boosttotal.odoo.com';
    const DB = 'techultra-solutions-boosttotal-live-29673368';
    const USER = 'recruteurgpe.prodcapvus@gmail.com'; 
    const PASS = '7e30aff65dd971e72b4a17eca2550fc5f4d61f85';

    const common = xmlrpc.createSecureClient(`${ODOO_URL}/xmlrpc/2/common`);
    
    common.methodCall('authenticate', [DB, USER, PASS, {}], (err, uid) => {
        if (err || !uid) {
            console.error("Erreur Auth:", err);
            return res.status(500).send("Auth Odoo échouée");
        }

        const models = xmlrpc.createSecureClient(`${ODOO_URL}/xmlrpc/2/object`);
        
        models.methodCall('execute_kw', [DB, uid, PASS, 'res.partner', 'create', [{
            'name': `${data.nom} ${data.prenom}`,
            'email': data.email,
            'phone': data.whatsapp,
            'city': data.ville,
            'is_company': false
        }]], (err, partnerId) => {
            if (err) {
                console.error("Erreur Création Contact:", err);
                return res.status(500).send("Erreur création contact");
            }
            
            models.methodCall('execute_kw', [DB, uid, PASS, 'crm.lead', 'create', [{
                'name': `WIX: ${data.nom} ${data.prenom}`,
                'partner_id': partnerId,
                'email_from': data.email,
                'phone': data.whatsapp,
                'x_studio_ville_1': data.ville,
                'x_studio_pays': data.pays,
                'x_studio_source_du_prospect': 'Site Web',
                'description': `Message: ${data.message} | Tél fixe/autre: ${data.telephone} | WhatsApp: ${data.whatsapp} | Société: ${data.societe} | Catégorie: ${data.categorie}`,
                'type': 'opportunity'
            }]], (err, result) => {
                if (err) {
                    console.error("Erreur Création Lead:", err);
                    return res.status(500).send("Erreur création lead");
                }
                res.send({ success: true, id: result });
            });
        });
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
