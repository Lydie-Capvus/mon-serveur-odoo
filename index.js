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

    // --- SÉCURITÉ : ON CAPTURE TOUTES LES DONNÉES EN TEXTE BRUT ---
    let notesFormulaire = "--- DONNÉES REÇUES DU SITE ---\n";
    for (const [key, value] of Object.entries(data)) {
        notesFormulaire += `${key}: ${value}\n`;
    }

    const common = xmlrpc.createSecureClient(`${ODOO_URL}/xmlrpc/2/common`);
    
    common.methodCall('authenticate', [DB, USER, PASS, {}], (err, uid) => {
        if (err || !uid) return res.status(500).send("Auth Odoo échouée");

        const models = xmlrpc.createSecureClient(`${ODOO_URL}/xmlrpc/2/object`);
        
        // 1. Création du Contact (Uniquement les champs texte standards)
        models.methodCall('execute_kw', [DB, uid, PASS, 'res.partner', 'create', [{
            'name': `${data.nom || ''} ${data.prenom || ''}`.trim() || "Nouveau Prospect",
            'email': data.email || '',
            'phone': String(data.whatsapp || data.telephone || ''),
            'is_company': false
        }]], (err, partnerId) => {
            
            // Si le contact échoue, on continue quand même pour ne pas perdre le Lead
            const finalPartnerId = err ? false : partnerId;

            // 2. Création de la Piste (Lead)
            models.methodCall('execute_kw', [DB, uid, PASS, 'crm.lead', 'create', [{
                'name': `WIX: ${data.nom || ''} ${data.prenom || ''}`,
                'partner_id': finalPartnerId,
                'email_from': data.email || '',
                'phone': String(data.whatsapp || data.telephone || ''),
                'x_studio_source_du_prospect': 'Site Web',
                // Ici Odoo acceptera n'importe quel texte, même les caractères arabes
                'description': notesFormulaire,
                'type': 'opportunity'
            }]], (err, result) => {
                if (err) {
                    console.error("Erreur Lead:", err);
                    return res.status(500).send("Erreur création lead");
                }
                res.send({ success: true, id: result });
            });
        });
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
