const fs = require('fs');
const path = require('path');

function readConfig(filePath) {
  const config = {};
  const data = fs.readFileSync(filePath, 'utf8');
  const lines = data.split('\n');

  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      config[key.trim()] = value.trim();
    }
  });

  return config;
}

const configPath = path.join(__dirname, 'config.txt');
const config = readConfig(configPath);

//console.log(config);
module.exports = config;