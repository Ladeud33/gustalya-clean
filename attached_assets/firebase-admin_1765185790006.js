const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Vous devrez télécharger ce fichier

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default admin;
