const fs = require('fs');
const packageJson = require('./package.json');

function getFormattedDate(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}${month}${day}`;
}

const isRelease = process.argv[2] === '--release';
let { version: baseVersion } = packageJson;
baseVersion = baseVersion.split('-')[0];

if (isRelease) {
  // Update in Github Action
  console.info('::set-output name=release_version::' + baseVersion);
} else {
  const nowTimestamp = Date.now();
  const newVersion = `${baseVersion}-alpha.${getFormattedDate(nowTimestamp)}.${nowTimestamp}`;
  fs.writeFileSync('./package.json', JSON.stringify({
    ...packageJson,
    version: newVersion,
  }, null, 2));

  console.log(
    `package.json is updated`, fs.readFileSync('./package.json', 'utf-8'));

  // Update in Github Action
  console.info('::set-output name=release_version::' + newVersion);
}
