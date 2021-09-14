// Grab a reference to localStorage when the app boots
const localStorage = window.localStorage;

function trimmedName(state) {
  const firstName = state.firstName && state.firstName.trim()
  const lastName = state.lastName && state.lastName.trim()
  const middleName = state.middleName && state.middleName.trim()

  return { firstName, middleName, lastName }
}

/**
 * Helper function to fetch stored case data from local
 * storage by a name string for a given person
 * @param {string} fullName 
 * @returns 
 */
function getPersonFromStorage(fullName) {
  return JSON.parse(localStorage.getItem(fullName));
}

/**
 * Gets the cases for the name string stored locally
 * @param {string} fullName 
 * @param {[*]} state 
 */
function setPersonInStorage(fullName, state) {
  localStorage.setItem(fullName, JSON.stringify(state));
}

function setCompletedOnNewCases(stored, newCases) {
  return newCases.map((newCase) => {
    // If we've stored this person in local storage,
    // we need to resolve the cases they may have stored
    // with any new cases. If a case is no longer available
    // from the state (API result), this loop will drop it.
    if (stored) {
      const found =
        stored &&
        stored.find(
          (storedCase) => storedCase.caseNumber === newCase.caseNumber
        );

      newCase.completed = found && found.completed ? found.completed : false;
    } else {
      newCase.completed = false;
    }

    return newCase;
  });
}

/**
 * Launch the North Carolina court notifications sign up site
 * in a new tab
 */
export function openCourtNotificationSite() {
  window.open(
    "https://www3.nccourts.org/onlineservices/notifications/menu.sp",
    "_blank"
  );
}


/**
 * For a given person, update a specific court case. It
 * will identify the case by its caseNumber.
 * @param {string} fullName
 * @param {*} courtCase The court case object returned from the server with the client-side managed completed state
 */
export function updateStoredCourtCase(state, courtCase) {
  const fullName = getCSVFullName(state);
  const storedCases = getPersonFromStorage(fullName);

  const storedCaseIndex = storedCases.findIndex(
    (stored) => stored.caseNumber === courtCase.caseNumber
  );

  storedCases[storedCaseIndex] = courtCase;

  setPersonInStorage(fullName, storedCases);

  return getPersonFromStorage(fullName);
}

/**
 * Method to generate the full name from the state's name properties
 * @param {{ firstName: string, middleName: string, lastName: string}} state
 * @returns {string}
 */
export function getCSVFullName(state) {
  const { firstName, middleName, lastName } = trimmedName(state)
  
  // I'm doing this so I don't have to think about
  // a trailing comma or null state when I combine the names
  const middle = middleName ? `,${middleName}` : "";

  return `${lastName},${firstName}${middle}`;
}

/**
 * Fetch the case data from the server for the search terms,
 * and merge with any data stored locally
 * @param {*} state 
 * @returns {[*]} Returns an array of case data
 */
export async function getCaseData(state) {
  const fullName = getCSVFullName(state);
  const storedCases = getPersonFromStorage(fullName);

  const response = await fetch("/api/court-search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({...state, ...trimmedName(state)}),
  });

  const newCases = await response.json();

  const mergedCases = setCompletedOnNewCases(storedCases, newCases);

  setPersonInStorage(fullName, mergedCases);

  return mergedCases;
}

export async function subscribeToDefendant(state) {
  const filteredCases = state.cases.filter(item => {
    return (item.defendant+'.'+item.dob === state.selectedDefendant);
  });
  const response = await fetch("/api/subscribe-to-defendant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      selectedDefendant: state.selectedDefendant,
      phone_number: state.phone_number,
      details: filteredCases[0],
    })
  });
  return response.json();
}
