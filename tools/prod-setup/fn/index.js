/**
 * One-off production setup, run locally through the Functions emulator
 * (which uses your `firebase login` session — no service-account key needed):
 *   1. gives the photographer's account the `admin` claim (opens #/admin),
 *   2. sets CORS on the Storage bucket (lets clients download finished photos).
 * Nothing here is deployed. Run it with: tools/prod-setup/run.sh <photographer's login e-mail>
 */
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
admin.initializeApp();

const BUCKET = 'kuczewska-ee655.firebasestorage.app';
const CORS = require('../../../storage.cors.json');

exports.setup = onRequest(async (req, res) => {
  const out = {};
  try {
    const email = String(req.query.email || '');
    if (!email) throw new Error('Pass the account e-mail: run.sh <email>');
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true });
    out.adminClaims = (await admin.auth().getUser(user.uid)).customClaims;
  } catch (e) {
    out.adminError = String(e);
  }
  try {
    const bucket = admin.storage().bucket(BUCKET);
    await bucket.setCorsConfiguration(CORS);
    const [meta] = await bucket.getMetadata();
    out.cors = meta.cors;
    out.bucketLocation = meta.location;
  } catch (e) {
    out.corsError = String(e);
  }
  res.json(out);
});
