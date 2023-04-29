import * as path from 'path';

const scriptName = process.argv[2];
const scriptPath = path.join(__dirname, "scripts/" + scriptName);

require(scriptPath);

