import path from 'path';
import fs from 'fs'

const cvPath = path.resolve(`./src/plugins/create-vision-profile`) 
const ipPath = path.resolve(`./src/plugins/import-puchased-accounts`)

var filesCV = fs.readdirSync(cvPath);
var filesIp = fs.readdirSync(cvPath);

console.log(cvPath)
console.log(filesCV)

console.log(ipPath)
console.log(filesIp)

export default () => ({
  'create-vision-profile': {
    enabled: true,
    resolve: cvPath
  },
  'import-puchased-accounts': {
    enabled: true,
    resolve: ipPath
  },
});
