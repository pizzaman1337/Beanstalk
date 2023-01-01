const { impersonateBeanstalkOwner } = require('../utils/signer.js');
const { upgradeWithNewFacets } = require('../scripts/diamond.js');
const { BEANSTALK, UNRIPE_LP } = require('../test/utils/constants.js');
const beanstalkABI = require("../abi/Beanstalk.json");


async function logFirstAndLastDeposit (
        account
    ) {
    console.log('-----------------------------------')
    console.log('Logging First and Last AddDeposit events\n')
    

    const contract = new ethers.Contract(BEANSTALK, beanstalkABI, account);

    // const addDeposits = await contract.filters.AddDeposit(null);


    //create an event filter to find all the AddDeposits for unripe LP token
    // let eventFilter = contract.filters.AddDeposit(null, UNRIPE_LP);
    let eventFilter = contract.filters.AddDeposit();
    //the to block of 0xe91fe4 was suggested by hardhat but I think this needs to be updated
    const addDeposits = await contract.queryFilter(eventFilter, 0x0, 0xe91fe4);

    // console.log('addDeposits: ', addDeposits);
    console.log('addDeposits 0: ', addDeposits[0]);
    console.log('addDeposits -1: ', addDeposits[addDeposits.length-1]);
}


async function logLatest (
        account
    ) {
    console.log('-----------------------------------')
    console.log('logLatest deposits\n')
    
    const contract = new ethers.Contract(BEANSTALK, beanstalkABI, account);

    // const addDeposits = await contract.filters.AddDeposit(null);

    //create an event filter to find all the AddDeposits for unripe LP token
    // let eventFilter = contract.filters.AddDeposit(null, UNRIPE_LP);
    let eventFilter = contract.filters.AddDeposit();
    //the to block of 0xe91fe4 was suggested by hardhat but I think this needs to be updated
    const addDeposits = await contract.queryFilter(eventFilter, 16310000, 16310092);

    // console.log('addDeposits: ', addDeposits);
    // console.log('addDeposits 0: ', addDeposits[0]);
    console.log('addDeposits -2: ', addDeposits[addDeposits.length-2]);
    console.log('addDeposits -1: ', addDeposits[addDeposits.length-1]);
}


exports.logFirstAndLastDeposit = logFirstAndLastDeposit;
exports.logLatest = logLatest;
