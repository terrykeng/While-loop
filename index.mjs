import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from './build/index.main.mjs';
import { ask, yesno } from '@reach-sh/stdlib/ask.mjs';

const stdlib = loadStdlib(process.env);
const fmt = (x) => stdlib.formatCurrency(x, 4);
const startingbalanceAlice = stdlib.parseCurrency(6000);
const startingbalanceBob = stdlib.parseCurrency(100);

const accAlice = await stdlib.newTestAccount(startingbalanceAlice);
const accBob = await stdlib.newTestAccount(startingbalanceBob);
console.log('Hello Alice and Bob');
console.log('Launching');

const ctcAlice = accAlice.contract(backend);
const ctcBob = accBob.contract(backend, ctcAlice.getInfo())

const getBalance = async (who) => fmt(await stdlib.balanceOf(who));

console.log(`Alice previous balance is: ${await getBalance(accAlice)}`)
console.log(`Bob previous balance is: ${await getBalance(accBob)}`)

const Shared = (who) =>({
  seeOutcome: (outcome) => {
    if(outcome){
      console.log(`${who} sees Alice is still here so she gets back her tokens`)
    }
    else {
      console.log(`${who} sees Alice isnt here and the countdown is over so Bob inherits her tokens `)
    }
  },
  informTimeout: () => {
    console.log(`${who} observed a timeout`);
  },
});


console.log('Starting backend....');
await Promise.all([
  ctcAlice.p.Alice({
    ...Shared('Alice'),
    vaultDeposit: async () =>{
      const deposit = await ask(
        `Alice How much do you want to put in the vault?`, stdlib.parseCurrency
      )
      return deposit;
    },
    aliceState: async () =>{
      const state = await ask(`Alice are you still there yes or no?`, yesno);
      if(state){
        console.log('Alice is still with us');
      }
      else console.log('Alice is dead ;( ')
    return state;
    }

  }),
  ctcBob.p.Bob({
    ...Shared('Bob'),
    acceptTerms: async (t) =>{
      const vaultTerms = parseInt(t);
      const terms = await ask(`Bob do you accept the terms of ${fmt(vaultTerms)} as the amount deposited into the vault : `, yesno);
      if(terms){
        return terms;
      }
      else process.exit();
    }
  })
]);

console.log(`Alice present balance is: ${await getBalance(accAlice)}`);
console.log(`Bob present balance is: ${await getBalance(accBob)}`);

console.log('GoodBye');
process.exit();