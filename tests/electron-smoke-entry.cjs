// Test-only entry: keep single-instance sockets and user settings out of the test.
const electron = require('electron');
const fs = require('node:fs');
const path = require('node:path');
electron.app.requestSingleInstanceLock = () => true;
if (process.env.TECHLEAD_SMOKE_DIR) {
 const userData=path.join(process.env.TECHLEAD_SMOKE_DIR,'user-data');fs.mkdirSync(userData,{recursive:true});electron.app.setPath('userData',userData);
}
require('../desktop/main.cjs');
