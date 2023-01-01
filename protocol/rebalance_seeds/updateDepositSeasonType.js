const { UNRIPE_LP } = require('../test/utils/constants.js');
const { modifySeeds } = require('./modifySeeds');
const { BEAN, BEANSTALK, BCM, USDC, BEAN_3_CURVE, ZERO_ADDRESS, CURVE_ZAP, TEST_GNOSIS } = require('../test/utils/constants.js');
const { logFirstAndLastDeposit, logLatest } = require('./logDeposits');
const beanstalkABI = require("../abi/Beanstalk.json");
const { impersonateSigner, impersonateBeanstalkOwner } = require("../utils/signer");
const { upgradeWithNewFacets } = require('../scripts/diamond.js');
const { to6, to18 } = require('../test/utils/helpers');

//how to compile and run:
//npx hardhat compile && npx hardhat updateDepositSeasonType --network localhost

//use debugger:
//npx --node-options="--inspect" hardhat updateDepositSeasonType --network localhost

async function updateDepositSeasonType(account, deployAccount=undefined, mock=true, log=false, start=3, end=0) {
    

    console.log('starting updateDepositSeasonType');
    console.log('mock: ', mock);

    if (mock) {

        //reset back to block whatever for testing so we can just run this script over and over and mess with stuff each time
        await network.provider.request({
          method: "hardhat_reset",
          params: [{
              forking: {
                jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
                blockNumber: 16310083, //todo: update block number before launch
              },
            },],
        });


        //give BCM some eth so we can do stuff
        //0x thing necessary to impersonate contracts https://github.com/foundry-rs/foundry/issues/1943
        //this is taken from replant10.js
        await hre.network.provider.send("hardhat_setCode", [BCM, "0x"]);
        await hre.network.provider.send("hardhat_setBalance", [BCM, "0xDE0B6B3A7640000"]);
        
        console.log('gave bcm some eth');

        //deploy stuff
        const signer = await impersonateBeanstalkOwner()
        await upgradeWithNewFacets({
          diamondAddress: BEANSTALK,
          facetNames: ['Silo', 'SiloFacet', 'Storage', 'LibAppStorage'],
          bip: false,
          verbose: false,
          account: signer
        });
        console.log('upgraded facets');
    }

    await logLatest(account);
    await logFirstAndLastDeposit(account);

    //now use some account to add a deposit, let's see what kind of event is emitted

    //impersonateSigner
    const testFarmer = '0x002505eefcBd852a148f03cA3451811032A72f96';
    const signer = await impersonateSigner(testFarmer);
    await hre.network.provider.send("hardhat_setBalance", [testFarmer, "0xDE0B6B3A7640000"]);

    //call getDeposit, takes account address, token address, seasons uint32
    const contract = new ethers.Contract(BEANSTALK, beanstalkABI, signer);
    const someDeposit = await contract.getDeposit('0x002505eefcBd852a148f03cA3451811032A72f96', '0x1BEA3CcD22F4EBd3d37d731BA31Eeca95713716D', 2734);
    console.log('someDeposit: ', someDeposit);


    //give this account some unripe 
    // await hre.network.provider.send("hardhat_setCode", [UNRIPE_LP, "0x"]);
    // await hre.network.provider.send("hardhat_setBalance", [UNRIPE_LP, "0xDE0B6B3A7640000"]);
    // const unripeAccount =  await impersonateSigner(UNRIPE_LP);
    this.unripeLP = await ethers.getContractAt('MockToken', UNRIPE_LP, signer);
    // await this.unripeLP.mint(testFarmer, to6('10000000'));
    //for some reason can't get minting unripe to work, rather than digging in will just try to withdraw then deposit again


    const withdraw = await contract.withdrawDeposit('0x1BEA3CcD22F4EBd3d37d731BA31Eeca95713716D', 2734, 891022603, {gasLimit:10000000});
    // console.log('withdraw: ', withdraw);
    console.log('did the withdraw');

    //get current season
    const currentSeason = await contract.season({gasLimit:10000000});
    console.log('currentSeason: ', currentSeason);


    //sunrise?
    await network.provider.send("evm_increaseTime", [3600])
    await network.provider.send("evm_mine");
    const sunriseResult = await contract.sunrise({gasLimit:10000000});
    // console.log('sunriseResult: ', sunriseResult);
    console.log('did sunrise');
    //get current season
    const newSeason = await contract.season({gasLimit:10000000});
    console.log('newSeason: ', newSeason);
    



    const claimWithdrawal = await contract.claimWithdrawal('0x1BEA3CcD22F4EBd3d37d731BA31Eeca95713716D', currentSeason+1, 0, {gasLimit:10000000});
    // console.log('claimWithdrawal: ', claimWithdrawal);
    console.log('claimed the withdraw');

    //now check balance
    const newBalance = await this.unripeLP.balanceOf(testFarmer);
    console.log('newBalance: ', newBalance);


    //ok the above works, now let's do a new deposit
    const approval = await this.unripeLP.approve(BEANSTALK, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', { gasLimit:100000 });
    console.log('completed the approval for spending LP to beanstalk');


    const addDeposit = await contract.deposit('0x1BEA3CcD22F4EBd3d37d731BA31Eeca95713716D', 891022603, 0, {gasLimit:10000000});
    const receipt = await addDeposit.wait();
    console.log('addDeposit: ', addDeposit);
    // console.log('receipt: ', receipt);

    receipt.events.forEach(event => {
      console.log('event: ', event.eventSignature, event.args);
    });

    //log latest deposit
    const newDeposit = await contract.getDeposit('0x002505eefcBd852a148f03cA3451811032A72f96', '0x1BEA3CcD22F4EBd3d37d731BA31Eeca95713716D', 9617);
    console.log('newDeposit: ', newDeposit);

    //now read this deposit
    // await logLatestDepositEvent();
    await logLatest(account);
    const unripeLPDeposits2 = await logFirstAndLastDeposit(account);


    console.log('done updateDepositSeasonType');
  }

exports.updateDepositSeasonType = updateDepositSeasonType;