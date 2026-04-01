const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    const file = path.join(__dirname, '../data.json');
    let state = { config: {}, responses: {} };
    try {
      const content = await fs.readFile(file, 'utf8');
      state = JSON.parse(content);
    } catch {}
    if (data.type === 'config') state.config = data.payload;
    else if (data.type === 'response') state.responses[data.name] = data.payload;
    await fs.writeFile(file, JSON.stringify(state, null, 2));
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};