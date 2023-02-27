const { expect } = require('chai');
const hre = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('Voting', () => {
    describe('Getters', () => {
        async function deployVoterFixture() {
            const [owner, accountOne] = await ethers.getSigners();
            const Voting = await hre.ethers.getContractFactory('Voting');
            const voting = await Voting.deploy();

            return { voting, owner, accountOne };
        }

        it('getVoter should revert if voter address is not registered', async () => {
            const { voting, owner, accountOne } = await loadFixture(
                deployVoterFixture
            );

            await expect(
                voting.connect(accountOne).getVoter(accountOne.address)
            ).to.be.reverted;
        });

        it('getVoter should return a registered voter', async () => {
            const { voting, owner, accountOne } = await loadFixture(
                deployVoterFixture
            );

            await voting.addVoter(accountOne.address);
            const voter = await voting
                .connect(accountOne)
                .getVoter(accountOne.address);

            await expect(voter.isRegistered).to.be.true;
        });

        it('getOneProposal should revert if voter address is not registered', async () => {
            const { voting, owner, accountOne } = await loadFixture(
                deployVoterFixture
            );

            await expect(
                voting
                    .connect(accountOne)
                    .getOneProposal(ethers.BigNumber.from('1'))
            ).to.be.reverted;
        });

        it('getOneProposal should return a proposal', async () => {
            const { voting, owner, accountOne } = await loadFixture(
                deployVoterFixture
            );

            await voting.addVoter(accountOne.address);

            await voting.startProposalsRegistering();

            await voting.connect(accountOne).addProposal('a good proposal');

            const proposal = await voting
                .connect(accountOne)
                .getOneProposal(ethers.BigNumber.from('1'));

            await expect(proposal.description).to.be.equal('a good proposal');
        });
    });

    describe('Registration', () => {
        async function deployVoterFixture() {
            const [owner, otherAccount] = await ethers.getSigners();
            const Voting = await hre.ethers.getContractFactory('Voting');
            const voting = await Voting.deploy();

            return { voting, owner, otherAccount };
        }

        it('Should add voter', async () => {
            const { voting, owner } = await loadFixture(deployVoterFixture);
            await voting.addVoter(owner.address);

            const voter = await voting.getVoter(owner.address);

            expect(voter.isRegistered).to.be.true;
        });

        it('Should revert if on addVoter the sender is not the owner', async () => {
            const { voting, owner, otherAccount } = await loadFixture(
                deployVoterFixture
            );

            await expect(
                voting.connect(otherAccount).addVoter(otherAccount.address)
            ).to.be.reverted;
        });

        it('Should revert if address is already registered', async () => {
            const { voting, owner, otherAccount } = await loadFixture(
                deployVoterFixture
            );

            await voting.addVoter(otherAccount.address);

            await expect(voting.addVoter(otherAccount.address)).to.be.reverted;
        });

        it('Should revert if workflow status is not RegisteringVoters', async () => {
            const { voting, owner, otherAccount } = await loadFixture(
                deployVoterFixture
            );

            await voting.startProposalsRegistering();

            await expect(voting.addVoter(owner.address)).to.be.reverted;
        });

        it('Should emit event if voter is registered', async () => {
            const { voting, owner, otherAccount } = await loadFixture(
                deployVoterFixture
            );

            await expect(voting.addVoter(otherAccount.address))
                .to.emit(voting, 'VoterRegistered')
                .withArgs(otherAccount.address);
        });
    });

    describe('Proposal', () => {
        async function deployVoterFixture() {
            const [owner, accountOne] = await ethers.getSigners();
            const Voting = await hre.ethers.getContractFactory('Voting');
            const voting = await Voting.deploy();

            return { voting, owner, accountOne };
        }

        it('Should reverd if workflow status is not ProposalsRegistrationStarted', async () => {
            const { voting, owner, accountOne } = await loadFixture(
                deployVoterFixture
            );

            await voting.addVoter(accountOne.address);

            await expect(
                voting.connect(accountOne).addProposal('a good proposal')
            ).to.be.reverted;
        });

        it('Should reverd if proposal description is empty', async () => {
            const { voting, owner, accountOne } = await loadFixture(
                deployVoterFixture
            );

            await voting.addVoter(accountOne.address);

            await voting.startProposalsRegistering();

            await expect(voting.connect(accountOne).addProposal('')).to.be
                .reverted;
        });

        it('Should reverted if voter is not registered', async () => {
            const { voting, owner, accountOne } = await loadFixture(
                deployVoterFixture
            );

            await voting.startProposalsRegistering();

            await expect(
                voting.connect(accountOne).addProposal('a good proposal')
            ).to.be.reverted;
        });

        it('Should add a proposal', async () => {
            const { voting, owner, accountOne } = await loadFixture(
                deployVoterFixture
            );

            await voting.addVoter(accountOne.address);

            await voting.startProposalsRegistering();

            await voting.connect(accountOne).addProposal('a good proposal');

            const proposal = await voting.connect(accountOne).getOneProposal(1);

            await expect(proposal.description).to.be.equal('a good proposal');
        });

        it('Should emit a ProposalRegistered event', async () => {
            const { voting, owner, accountOne } = await loadFixture(
                deployVoterFixture
            );

            await voting.addVoter(accountOne.address);

            await voting.startProposalsRegistering();

            await expect(
                voting.connect(accountOne).addProposal('a good proposal')
            )
                .to.emit(voting, 'ProposalRegistered')
                .withArgs(1);
        });
    });

    describe('Vote', async () => {
        async function deployVoterFixture() {
            const [owner, accountOne, accountTwo] = await ethers.getSigners();
            const Voting = await hre.ethers.getContractFactory('Voting');
            const voting = await Voting.deploy();

            return { voting, owner, accountOne, accountTwo };
        }

        it('Should revert if address is not registered', async () => {
            const { voting, owner, accountOne, accountTwo } = await loadFixture(
                deployVoterFixture
            );

            await voting.addVoter(accountOne.address);

            await voting.startProposalsRegistering();

            await voting.connect(accountOne).addProposal('a good proposal');

            await voting.endProposalsRegistering();
            await voting.startVotingSession();

            await expect(voting.connect(accountTwo).setVote(1)).to.be.reverted;
        });

        it('Should revert if the voter already vote', async () => {
            const { voting, owner, accountOne, accountTwo } = await loadFixture(
                deployVoterFixture
            );

            await voting.addVoter(accountOne.address);

            await voting.startProposalsRegistering();

            await voting.connect(accountOne).addProposal('a good proposal');

            await voting.endProposalsRegistering();
            await voting.startVotingSession();

            await voting.connect(accountOne).setVote(1);

            await expect(voting.connect(accountOne).setVote(1)).to.be.reverted;
        });

        it('Should revert if workflow status is not VotingSessionStarted', async () => {
            const { voting, owner, accountOne, accountTwo } = await loadFixture(
                deployVoterFixture
            );

            await voting.addVoter(accountOne.address);

            await voting.startProposalsRegistering();

            await voting.connect(accountOne).addProposal('a good proposal');

            await voting.endProposalsRegistering();

            await expect(voting.connect(accountOne).setVote(1)).to.be.reverted;
        });

        it('Should revert if the proposal id does not exist', async () => {
            const { voting, owner, accountOne, accountTwo } = await loadFixture(
                deployVoterFixture
            );

            await voting.addVoter(accountOne.address);

            await voting.startProposalsRegistering();

            await voting.connect(accountOne).addProposal('a good proposal');

            await voting.endProposalsRegistering();
            await voting.startVotingSession();

            await expect(voting.connect(accountOne).setVote(99)).to.be.reverted;
        });

        it('Should add a vote for the proposal', async () => {
            const { voting, owner, accountOne, accountTwo } = await loadFixture(
                deployVoterFixture
            );

            await voting.addVoter(accountOne.address);

            await voting.startProposalsRegistering();

            await voting.connect(accountOne).addProposal('a good proposal');

            await voting.endProposalsRegistering();
            await voting.startVotingSession();

            await voting.connect(accountOne).setVote(1);

            const proposal = await voting.connect(accountOne).getOneProposal(1);

            await expect(proposal.voteCount).to.be.equal(1);
        });

        it('Should emit a Voted event', async () => {
            const { voting, owner, accountOne, accountTwo } = await loadFixture(
                deployVoterFixture
            );

            await voting.addVoter(accountOne.address);

            await voting.startProposalsRegistering();

            await voting.connect(accountOne).addProposal('a good proposal');

            await voting.endProposalsRegistering();
            await voting.startVotingSession();

            await expect(voting.connect(accountOne).setVote(1))
                .to.emit(voting, 'Voted')
                .withArgs(accountOne.address, 1);
        });
    });

    describe('State', async () => {
        async function deployVoterFixture() {
            const [owner, accountOne, accountTwo] = await ethers.getSigners();
            const Voting = await hre.ethers.getContractFactory('Voting');
            const voting = await Voting.deploy();

            return { voting, owner, accountOne, accountTwo };
        }

        it('Initial State should be RegisteringVoters', async () => {
            const { voting, owner, accountOne } = await loadFixture(
                deployVoterFixture
            );

            const workflowStatus = await voting.workflowStatus.call();

            await expect(workflowStatus).to.be.equal(0);
        });

        it('Second State should be ProposalsRegistrationStarted', async () => {
            const { voting, owner, accountOne } = await loadFixture(
                deployVoterFixture
            );

            await expect(voting.startProposalsRegistering())
                .to.emit(voting, 'WorkflowStatusChange')
                .withArgs(0, 1);

            const workflowStatus = await voting.workflowStatus.call();

            await expect(workflowStatus).to.be.equal(1);
        });

        it('Third State should be ProposalsRegistrationEnded', async () => {
            const { voting, owner, accountOne } = await loadFixture(
                deployVoterFixture
            );

            await voting.startProposalsRegistering();
            await expect(voting.endProposalsRegistering())
                .to.emit(voting, 'WorkflowStatusChange')
                .withArgs(1, 2);

            const workflowStatus = await voting.workflowStatus.call();

            await expect(workflowStatus).to.be.equal(2);
        });

        it('Fourth State should be StartVotingSession', async () => {
            const { voting, owner, accountOne } = await loadFixture(
                deployVoterFixture
            );

            await voting.startProposalsRegistering();
            await voting.endProposalsRegistering();
            await expect(voting.startVotingSession())
                .to.emit(voting, 'WorkflowStatusChange')
                .withArgs(2, 3);

            const workflowStatus = await voting.workflowStatus.call();

            await expect(workflowStatus).to.be.equal(3);
        });

        it('Fifth State should be EndVotingSession and emit a WorkflowStatusChange', async () => {
            const { voting, owner, accountOne } = await loadFixture(
                deployVoterFixture
            );

            await voting.startProposalsRegistering();
            await voting.endProposalsRegistering();
            await voting.startVotingSession();
            await expect(voting.endVotingSession())
                .to.emit(voting, 'WorkflowStatusChange')
                .withArgs(3, 4);

            const workflowStatus = await voting.workflowStatus.call();

            await expect(workflowStatus).to.be.equal(4);
        });

        it('Sixth State should be EndVotingSession and emit a WorkflowStatusChange', async () => {
            const { voting, owner, accountOne } = await loadFixture(
                deployVoterFixture
            );

            await voting.startProposalsRegistering();
            await voting.endProposalsRegistering();
            await voting.startVotingSession();
            await voting.endVotingSession();
            await expect(voting.tallyVotes())
                .to.emit(voting, 'WorkflowStatusChange')
                .withArgs(4, 5);

            const workflowStatus = await voting.workflowStatus.call();

            await expect(workflowStatus).to.be.equal(5);
        });

        it('Tally should change the state winner id', async () => {
            const { voting, owner, accountOne, accountTwo } = await loadFixture(
                deployVoterFixture
            );

            await voting.addVoter(accountOne.address);
            await voting.addVoter(accountTwo.address);
            await voting.addVoter(owner.address);
            await voting.startProposalsRegistering();
            await voting.connect(accountOne).addProposal('a good proposal');
            await voting.connect(accountOne).addProposal('a bad proposal');
            await voting.endProposalsRegistering();
            await voting.startVotingSession();
            await voting.connect(accountOne).setVote(0);
            await voting.connect(accountTwo).setVote(1);
            await voting.connect(owner).setVote(1);
            await voting.endVotingSession();
            await voting.tallyVotes();

            const winningProposalID = await voting.winningProposalID.call();

            await expect(winningProposalID).to.be.equal(1);
        });

        it('Should revert if the status workflow is not good', async () => {
            const { voting, owner, accountOne, accountTwo } = await loadFixture(
                deployVoterFixture
            );

            await expect(voting.endProposalsRegistering()).to.reverted;
            await expect(voting.startVotingSession()).to.reverted;
            await expect(voting.endVotingSession()).to.reverted;
            await expect(voting.tallyVotes()).to.reverted;
        });

        it('Should revert if we try to call a previous changed status function', async () => {
            const { voting, owner, accountOne, accountTwo } = await loadFixture(
                deployVoterFixture
            );

            await voting.startProposalsRegistering();
            await voting.endProposalsRegistering();
            await voting.startVotingSession();
            await voting.endVotingSession();

            await expect(voting.startProposalsRegistering()).to.reverted;
            await expect(voting.endProposalsRegistering()).to.reverted;
            await expect(voting.startVotingSession()).to.reverted;
            await expect(voting.endVotingSession()).to.reverted;
        });
    });
});
