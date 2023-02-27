# Voting Test With Hardhat

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

## Test Structure

One global discribe for the voting contract split like the Voting.sol comments organisation.
Each sub-describe have a fixture to deploy and get accounts.

### GETTERS

-   getVoter should revert if voter address is not registered
-   getVoter should return a registered voter
-   getOneProposal should revert if voter address is not registered
-   getOneProposal should return a proposal

### REGISTRATION

-   Should add voter
-   Should revert if on addVoter the sender is not the owner
-   Should revert if address is already registered
-   Should revert if workflow status is not RegisteringVoters
-   Should emit event if voter is registered

### PROPOSAL

-   Should reverd if workflow status is not ProposalsRegistrationStarted
-   Should reverd if proposal description is empty
-   Should reverted if voter is not registered
-   Should add a proposal
-   Should emit a ProposalRegistered event

### VOTE

-   Should revert if address is not registered
-   Should revert if the voter already vote
-   Should revert if workflow status is not VotingSessionStarted
-   Should revert if the proposal id does not exist
-   Should add a vote for the proposal
-   Should emit a Voted event

### STATE

-   Initial State should be RegisteringVoters
-   Second State should be ProposalsRegistrationStarted
-   Third State should be ProposalsRegistrationEnded
-   Fourth State should be StartVotingSession
-   Fifth State should be EndVotingSession and emit a WorkflowStatusChange
-   Sixth State should be EndVotingSession and emit a WorkflowStatusChange
-   Tally should change the state winner id
-   Should revert if the status workflow is not good
-   Should revert if we try to call a previous changed status function
