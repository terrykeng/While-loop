"reach 0.1";

const Shared = {
  seeOutcome: Fun([Bool], Null),
  informTimeout: Fun([], Null)
};

export const main = Reach.App(() => {
  const Alice = Participant('Alice', {
    ...Shared,
    vaultDeposit: Fun([], UInt),
    aliceState: Fun([], Bool),
    
  });
  const Bob = Participant('Bob', {
    ...Shared,
    acceptTerms: Fun([UInt], Bool),
  });
  init();

  const informTimeout = () => {
    each([Alice, Bob], () => {
      interact.informTimeout();
    });
  };

  Alice.only(() => {
    const deposit = declassify(interact.vaultDeposit());
 
  })
  Alice.publish(deposit);
  commit();
  Alice.pay(deposit);
  commit();

  Bob.only(() => {
    const acceptedTerms = declassify(interact.acceptTerms(deposit));
  })
  Bob.publish(acceptedTerms); 
  const deadline = 3;
  const end = lastConsensusTime() + deadline;

  var [state] = [false];
  invariant(balance() == deposit);
  while ( lastConsensusTime() <= end ) {
    commit();

    Alice.only(() => {
     const aliceState = declassify(interact.aliceState());
    });
    Alice.publish(aliceState)
      .timeout(relativeTime(end), () => closeTo(Bob, informTimeout));
    commit();
    Bob.publish();
    [state] = [aliceState];
    continue;
  }
  if (lastConsensusTime() >= end && state){
    transfer(deposit).to(Alice)
    each([Alice, Bob], () => {
      interact.seeOutcome(true);
    });
  }
  else{
    transfer(deposit).to(Bob)
    each([Alice, Bob], () => {
      interact.seeOutcome(false);
    });
  }
  transfer(balance()).to(Alice)
  commit();
});