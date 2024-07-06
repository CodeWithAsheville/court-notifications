function CourtCase([
  court,
  defendant,
  dob,
  courtDate,
  courtRoom,
  session,
  [caseNumber, caseDetailsUri],
  citationNumber,
]) {
  const caseDetailsURLPrefix = 'http://www1.aoc.state.nc.us';

  const generateLinkToCaseDetails = (uri) => caseDetailsURLPrefix + uri;

  return {
    court,
    defendant,
    dob,
    courtDate,
    courtRoom,
    session,
    caseNumber,
    linkToCaseDetails: generateLinkToCaseDetails(caseDetailsUri),
    citationNumber,
  };
}

module.exports = {
  CourtCase,
};
