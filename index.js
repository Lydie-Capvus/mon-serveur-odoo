const express = require('express');
const cors = require('cors');
const xmlrpc = require('xmlrpc');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/odoo-lead', (req, res) => {
    const data = req.body;

    const ODOO_URL = 'https://boost-total-developpement.odoo.com';
    const DB = 'boost-total-developpement'; 
    const USER = 'recruteurgpe.prodcapvus@gmail.com'; 
    const PASS = '7e30aff65dd971e72b4a17eca2550fc5f4d61f85';

    const common = xmlrpc.createSecureClient(`${ODOO_URL}/xmlrpc/2/common`);
    
    common.methodCall('authenticate', [DB, USER, PASS, {}], (err, uid) => {
        if (err || !uid) {
            console.error("Erreur Auth:", err);
            return res.status(500).send("Auth Odoo échouée");
        }

        const models = xmlrpc.createSecureClient(`${ODOO_URL}/xmlrpc/2/object`);
        
        models.methodCall('execute_kw', [DB, uid, PASS, 'crm.lead', 'create', [{
            'name': `Lead Web: ${data.nom} ${data.prenom}`,
            'contact_name': `${data.nom} ${data.prenom}`,
            'email_from': data.email,
            'phone': data.telephone,
            'company_id': 2, 
            'description': `Message: ${data.message} | Pays: ${data.pays} | Ville: ${data.ville} | Société: ${data.societe} | Catégorie: ${data.categorie}`,
            'partner_name': data.societe,
            'type': 'opportunity'
        }]], (err, result) => {
            if (err) {
                console.error("Erreur Création:", err);
                return res.status(500).send("Erreur création Odoo");
            }
            res.send({ success: true, id: result });
        });
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
