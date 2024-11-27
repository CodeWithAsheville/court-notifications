const Mustache = require('mustache');

const nameTemplate = '{{fname}} {{mname}} {{lname}} {{suffix}}';

function formatName(fname, mname, lname, suffix) {
  const name = {
    fname,
    mname: mname || '',
    lname,
    suffix: suffix || '',
  };
  return Mustache.render(nameTemplate, name);
}

module.exports = {
  formatName,
};
