function computeUrlName(defendant) {
  let name = defendant.last_name + ',' + defendant.first_name;
  if (defendant.middle_name) name += ',' + defendant.middle_name;
  if (defendant.suffix) name += ',' + defendant.suffix; 
  return name;
}

module.exports = {
  computeUrlName
}
