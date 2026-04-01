const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
  try {
    const file = path.join(__dirname, '../data.json');
    const content = await fs.readFile(file, 'utf8');
    const state = JSON.parse(content);
    return { statusCode: 200, body: JSON.stringify(state) };
  } catch {
    return { statusCode: 200, body: JSON.stringify({ config: {}, responses: {} }) };
  }
};
