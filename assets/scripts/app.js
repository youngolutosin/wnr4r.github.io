"use-strict";

const defaultResult = 0;
const apiDelay = 200; //ms
let currentResult = defaultResult;
let mineID = 0;
let mineScanRange = 5000;
let reinforcementTime = 0;
let faction1 = "MACHINE";
let faction2 = "";
const baseURL = "https://idle-game-api.crabada.com/public/idle";
//let url = baseURL+'/mines?user_address=0xaf003b04308c0d748be64a95834a3822f776417e&limit=100&page=1&orderBy=start_time&order=desc';
//let url2 = 'https://idle-api.crabada.com/public/idle/mine/6575397';

function getUserNumberInput() {
  return parseInt(usrInput.value);
}

//get all inputs
function getUserInput() {
  mineID = parseInt(mineIDField.value);
  mineScanRange = parseInt(mineScanRangeField.value);
  reinforcementTime = parseInt(reinforcementTimeField.value);
}

//get input with prompt
function getInputFromPrompt(){
  mineID = parseInt(prompt("Enter starting mine ID"));
  //mineScanRange = parseInt(prompt("Enter mine scan range"));
  reinforcementTime = parseInt(prompt("Enter reinforcement time"));
  //faction1 = (prompt("Enter desired 1st faction, leave empty if you want all")).toUpperCase();
  //faction2 = (prompt("Enter desired 2nd faction, leave empty if you want all")).toUpperCase();
}


//start general processing after pressing enter
processHandler = () => {
  //getUserInput();
  getInputFromPrompt();
  mainProgram(mineID);
  
}


async function mainProgram(mineID){
  try 
  {
    const stopMineID = mineID + mineScanRange;
    for(let currentMineID = mineID; currentMineID <= stopMineID; currentMineID++){
      console.log(`Currently scanning mine: ${currentMineID}`);
      const teamFaction = await getMinerFaction(currentMineID);
      if ((faction1 === teamFaction || faction2 === teamFaction) || (faction1 === "" && faction2 === ""))
      {  
        const minerAddress = await getMinerAddress(currentMineID);
        //check to see if last reinforcement time is greater to user specified time.
        const lastReinforcementTimeInHrs = await getLastReinforcementTime(minerAddress);
        if (lastReinforcementTimeInHrs < reinforcementTime)
        {
          continue;
        }      
        const canCrabJoinTeamStatus = await canCrabJoinTeam(minerAddress);
        const areCrabsInGameStatus = await areCrabsInGame(minerAddress);
        //console.log(filteredResult);
        if (minerAddress === "" || canCrabJoinTeamStatus || areCrabsInGameStatus)
        {
          //console.log("attacked");
          continue;
        }
        else 
        {
          console.log(`CrabFaction: ${teamFaction} \t MineID: ${currentMineID} \t OwnerAdress: ${minerAddress} \t LastReinforceTime:  ${lastReinforcementTimeInHrs} Hrs`);
          const mineDetails = `CrabFaction: ${teamFaction} \t MineID: ${currentMineID} \t OwnerAdress: ${minerAddress} \t LastReinforceTime:  ${lastReinforcementTimeInHrs} Hrs`;
          printMines(mineDetails);
        }
      }
    }
    console.log("Completed!!!");
  }  
  catch(err)
  {
    console.log(`The following error occured: ${err.message}`);
  }

}




function printMines(mineDetails) {
  //create new li element
var newMineItem = document.createElement("li");

//create new text node
var mineListValue = document.createTextNode(mineDetails);

//add text node to li element
newMineItem.appendChild(mineListValue);

//add new list element built in previous steps to unordered list
//called numberList
minesList.appendChild(newMineItem);
  /* currentResultOutput.textContent = result;
  currentCalculationOutput.textContent = text; */
}

async function getLastReinforcementTime(minerAddress){
  try
  {
    //if address is invalid, no point doing stuffs
    if (minerAddress === "")
    {
        return 0;
    }
    const url = baseURL+`/crabadas/lending/history?borrower_address=${minerAddress}&orderBy=transaction_time&order=desc&limit=2`
    const stuff = await apiCall(url);
    //check to see if wallet has ever been to tarvern
    const totalRecord = stuff.result.totalRecord;
    if(totalRecord <= 0)
    {
        return 0;
    }
    const lastReinforcementTimeInSec = stuff.result.data[0].transaction_time;
    let today = new Date();
    //get cuurent time and conver to seconds
    today = Math.floor(today.getTime()/1000);
    //get how long ago miner reinforced (in seconds)
    const lastReinforcementSince = today - lastReinforcementTimeInSec;
    const lastReinforcementTimeInHrs = Math.floor(lastReinforcementSince / 3600);
    return lastReinforcementTimeInHrs;
  }
  catch(err)
  {
    console.log(`The following error occured: ${err.message}`);
  }
}

//Get miner's faction
async function getMinerFaction(mineID){
  try
  {
    const url = baseURL+`/mine/${mineID}`;
    const stuff = await apiCall(url);
    return stuff.result.defense_team_faction;
  }
  catch(err)
  {
    console.log(`The following error occured: ${err.message}`);
  }
}

//check to see if miner has crabs in games that can be used for reinforcing
async function areCrabsInGame(minerAddress) {
  try{
      let crabsInGame = false;
      //check to see that address returned is valid
      if (minerAddress === "")
      {
          return crabsInGame= true;
      }
      let url = baseURL+`/crabadas/in-game?user_address=${minerAddress}&page=1&limit=100&order=desc&orderBy=mine_point`;
      const stuff = await apiCall(url);

      //get total pages
      const totalPages = stuff.result.totalPages;
      //current page
      const currentPage = stuff.result.page;
      const totalRecord = stuff.result.totalRecord;
      const remainder = totalRecord % 3;

      //check if crab isnt a multiple of 3, 
      if(remainder !== 0){
        return crabsInGame = true;
      }

      //handle single in-game page
      if(totalPages === currentPage){
        //we need to limit to the index that can be processed
        for(let i=0; i < totalRecord; i++){
          const teamID = stuff.result.data[i].team_id;
          if(teamID == null){
            return crabsInGame = true;
          }
        }
      }

      //hnadles in-game multiple pages when totalPages > page
      if(totalPages > 1){
        //loop through each page by calling the api - start from page 1
        for(let i=1; i<= totalPages; i++){
          //call the api starting from page 1
          let url = baseURL+`/crabadas/in-game?user_address=${minerAddress}&page=${i}&limit=100&order=desc&orderBy=mine_point`;
          const stuff = await apiCall(url);
          const dataArray = stuff.result.data;

          //loop through the data for each page
          for (let k = 0; k < dataArray.length; k++)
          {
              const teamID = stuff.result.data[k].team_id;

              if (teamID === "")
              {
                  return crabsInGame = true;
              }
          }

        }
      }
      return crabsInGame;
  }
  catch(err)
  {
    console.log(`The following error occured: ${err.message}`);
  }
}

//can crab join team check
async function canCrabJoinTeam(minerAddress){
  try
  {
    let crabsInGame = false;
    //check to see that address returned is valid
    if (minerAddress === "")
    {
        return crabsInGame= true;
    }

    const url = baseURL+`/crabadas/can-join-team?user_address=${minerAddress}`;
    const stuff = await apiCall(url);
    if (stuff.result.totalRecord > 0)
    {
      return crabsInGame = true;
    }
    return crabsInGame;
  }
  catch(err)
  {
    console.log(`The following error occured: ${err.message}`);
  }
}

async function getMinerAddress (mineID){
  try{
  const url = baseURL+`/mine/${mineID}`;
  const stuff = await apiCall(url);
  const minerAddress = (stuff.result.attack_team_id > 0) ? "" : stuff.result.owner
  return minerAddress;
  }
  catch(err)
  {
    console.log(`The following error occured: ${err.message}`);
  }
  
}

//API with error handling
async function apiCallNew (urlApi){
  await sleep(1000);
  fetch(urlApi, {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Other',
      }).then(response => response.json())
      .then(data => {
        //check if response is json
        //const myJson = response ? await response.json() : null; //extract JSON from the http response and return it, else null
        //const myJson = response.json();
        //check for error in response
        /* if(!response.ok)
        {
          //get error message from body or response status
          const error = (myJson.message) || response.status;
          return Promise.reject(error);
        } */
        
        console.log(data);
        return data; //return json if response is ok

      }).catch(error => {
        console.error(`There was an error ${error}`);
        return error;
      });
}

//call API  
async function apiCall (urlApi){
  await sleep(apiDelay);
  try{
        const response = await fetch(urlApi, {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Other',
      });
        const myJson = await response.json(); //extract JSON from the http response
        return myJson;
  //console.log(myJson);
    }
    catch(err)
    {
      console.error('Failed to GET: ' + err)
      if (typeof err.response !== 'undefined' && typeof err.response.data !== 'undefined' && err.response.data !== null) 
      {
        throw new Error(err.response.data)
      } else 
      {
        throw err
      }
      //console.log(`The following error occured: ${err.message}`);
    }
}

//sleep method
function sleep(ms) {
  return new Promise(
    resolve => setTimeout(resolve, ms)
  );
}


//jargons
addBtn.addEventListener('click', processHandler);
