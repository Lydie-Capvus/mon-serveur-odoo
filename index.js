const express = require('express');
const cors = require('cors');
const xmlrpc = require('xmlrpc');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/odoo-lead', (req, res) => {
    const data = req.body;
    
    // Log pour confirmer la réception dans Render
    console.log("RECU DE WIX :", JSON.stringify(data, null, 2));

    const ODOO_URL = 'https://techultra-solutions-boosttotal.odoo.com';
    const DB = 'techultra-solutions-boosttotal-live-29673368';
    const USER = 'recruteurgpe.prodcapvus@gmail.com'; 
    const PASS = '7e30aff65dd971e72b4a17eca2550fc5f4d61f85';

    // Transformation de TOUTES les données en texte pour la description Odoo
    let notesFormulaire = "--- DONNÉES DU FORMULAIRE ---\n";
    for (const [key, value] of Object.entries(data)) {
        notesFormulaire += `${key}: ${value}\n`;
    }

    const common = xmlrpc.createSecureClient(`${ODOO_URL}/xmlrpc/2/common`);
    
    common.methodCall('authenticate', [DB, USER, PASS, {}], (err, uid) => {
        if (err || !uid) {
            console.error("ERREUR AUTHENTIFICATION ODOO");
            return res.status(500).send("Auth échouée");
        }

        const models = xmlrpc.createSecureClient(`${ODOO_URL}/xmlrpc/2/object`);
        
        // 1. Création du Contact (Champs de base uniquement)
        models.methodCall('execute_kw', [DB, uid, PASS, 'res.partner', 'create', [{
            'name': `${data.nom || ''} ${data.prenom || ''}`.trim() || "Prospect Wix",
            'email': data.email || '',
            'phone': String(data.whatsapp || data.telephone || ''),
            'is_company': false
        }]], (err, partnerId) => {
            
            const finalPartnerId = err ? false : partnerId;

            // 2. Création de la Piste (Lead) dans le CRM
            models.methodCall('execute_kw', [DB, uid, PASS, 'crm.lead', 'create', [{
                'name': `WIX: ${data.nom || ''} ${data.prenom || ''}`,
                'partner_id': finalPartnerId,
                'email_from': data.email || '',
                'phone': String(data.whatsapp || data.telephone || ''),
                'x_studio_source_du_prospect': 'Site Web',
                'description': notesFormulaire,
                'type': 'opportunity'
            }]], (err, result) => {
                if (err) {
                    console.error("ERREUR CRÉATION ODOO:", err);
                    return res.status(500).send("Erreur Odoo");
                }
                console.log("SUCCÈS : Lead créé dans Odoo avec l'ID", result);
                res.send({ success: true, id: result });
            });
        });
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur prêt sur port ${PORT}`));
