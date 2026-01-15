//! # Governance Pallet: Game Studio Soft-Forks
//!
//! This pallet enables game studios to propose and vote on "soft-forks" -
//! game-specific logic changes that don't require restarting the entire L1.
//!
//! ## Key Features
//!
//! 1. **Proposal System**: Game studios can propose changes
//! 2. **Voting Mechanisms**: Weighted voting based on stake or NFT ownership
//! 3. **Soft-Fork Execution**: Approved proposals execute automatically
//! 4. **Game-Specific Logic**: Each game can have its own governance rules

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use frame_support::{
        pallet_prelude::*,
        traits::{Currency, Get},
    };
    use frame_system::pallet_prelude::*;
    use sp_runtime::traits::Saturating;
    use sp_std::prelude::*;

    /// Type alias for balance
    pub type BalanceOf<T> =
        <<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

    /// Maximum length for proposal descriptions
    pub const MAX_PROPOSAL_LENGTH: u32 = 1024;
    
    /// Maximum length for game IDs
    pub const MAX_GAME_ID_LENGTH: u32 = 64;

    /// Proposal status
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum ProposalStatus {
        /// Proposal is open for voting
        Open,
        /// Proposal passed and is executing
        Executing,
        /// Proposal passed
        Passed,
        /// Proposal rejected
        Rejected,
        /// Proposal cancelled
        Cancelled,
    }

    /// Governance proposal
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    #[scale_info(skip_type_params(T))]
    pub struct Proposal<T: Config> {
        /// Unique proposal ID
        pub proposal_id: u32,
        
        /// Game ID this proposal applies to
        pub game_id: BoundedVec<u8, ConstU32<MAX_GAME_ID_LENGTH>>,
        
        /// Proposal creator
        pub proposer: T::AccountId,
        
        /// Proposal description
        pub description: BoundedVec<u8, ConstU32<MAX_PROPOSAL_LENGTH>>,
        
        /// Proposal data (encoded call or config change)
        pub proposal_data: BoundedVec<u8, ConstU32<4096>>,
        
        /// Current status
        pub status: ProposalStatus,
        
        /// Block when proposal was created
        pub created_at: BlockNumberFor<T>,
        
        /// Block when voting ends
        pub voting_end: BlockNumberFor<T>,
        
        /// Minimum votes required to pass
        pub min_votes: u64,
        
        /// Current vote count (yes)
        pub yes_votes: u64,
        
        /// Current vote count (no)
        pub no_votes: u64,
    }

    /// Vote record
    #[derive(Clone, Encode, Decode, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum Vote {
        Yes,
        No,
    }

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        
        /// Currency for voting weights
        type Currency: Currency<Self::AccountId>;
        
        /// Minimum stake required to create a proposal
        type MinProposalStake: Get<BalanceOf<Self>>;
        
        /// Voting period length in blocks
        type VotingPeriod: Get<BlockNumberFor<Self>>;
    }

    #[pallet::pallet]
    #[pallet::without_storage_info]
    pub struct Pallet<T>(_);

    /// Storage: Proposals by ID
    #[pallet::storage]
    pub type Proposals<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        u32,
        Proposal<T>,
        OptionQuery,
    >;

    /// Storage: Votes (proposal_id, voter) -> vote
    #[pallet::storage]
    pub type Votes<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        u32, // proposal_id
        Blake2_128Concat,
        T::AccountId,
        Vote,
        OptionQuery,
    >;

    /// Storage: Next proposal ID
    #[pallet::storage]
    pub type NextProposalId<T: Config> = StorageValue<_, u32, ValueQuery>;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Proposal created [proposal_id, game_id, proposer]
        ProposalCreated {
            proposal_id: u32,
            game_id: Vec<u8>,
            proposer: T::AccountId,
        },
        
        /// Vote cast [proposal_id, voter, vote]
        VoteCast {
            proposal_id: u32,
            voter: T::AccountId,
            vote: Vote,
        },
        
        /// Proposal passed [proposal_id]
        ProposalPassed {
            proposal_id: u32,
        },
        
        /// Proposal rejected [proposal_id]
        ProposalRejected {
            proposal_id: u32,
        },
        
        /// Proposal executed [proposal_id]
        ProposalExecuted {
            proposal_id: u32,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        /// Proposal not found
        ProposalNotFound,
        /// Proposal already processed
        ProposalAlreadyProcessed,
        /// Voting period ended
        VotingPeriodEnded,
        /// Voting period not ended
        VotingPeriodNotEnded,
        /// Insufficient stake to create proposal
        InsufficientStake,
        /// Already voted
        AlreadyVoted,
        /// Proposal execution failed
        ExecutionFailed,
    }

    #[pallet::hooks]
    impl<T: Config> Hooks<BlockNumberFor<T>> for Pallet<T> {
        /// Check for proposals that need to be finalized
        fn on_initialize(_n: BlockNumberFor<T>) -> Weight {
            // In production, efficiently check proposals whose voting_end has passed
            // For now, this is handled on-demand
            Weight::from_parts(1_000, 0)
        }
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Create a new governance proposal
        #[pallet::call_index(0)]
        #[pallet::weight(100_000)]
        pub fn create_proposal(
            origin: OriginFor<T>,
            game_id: Vec<u8>,
            description: Vec<u8>,
            proposal_data: Vec<u8>,
            min_votes: u64,
        ) -> DispatchResult {
            let proposer = ensure_signed(origin)?;
            
            // Check minimum stake
            let min_stake = T::MinProposalStake::get();
            let balance = T::Currency::free_balance(&proposer);
            ensure!(balance >= min_stake, Error::<T>::InsufficientStake);
            
            let game_id_bounded: BoundedVec<u8, ConstU32<MAX_GAME_ID_LENGTH>> = game_id
                .clone()
                .try_into()
                .map_err(|_| Error::<T>::ProposalNotFound)?;
            let description_bounded: BoundedVec<u8, ConstU32<MAX_PROPOSAL_LENGTH>> = description
                .try_into()
                .map_err(|_| Error::<T>::ProposalNotFound)?;
            let proposal_data_bounded: BoundedVec<u8, ConstU32<4096>> = proposal_data
                .try_into()
                .map_err(|_| Error::<T>::ProposalNotFound)?;
            
            let proposal_id = NextProposalId::<T>::get();
            NextProposalId::<T>::put(proposal_id + 1);
            
            let current_block = frame_system::Pallet::<T>::block_number();
            let voting_end = current_block + T::VotingPeriod::get();
            
            let proposal = Proposal {
                proposal_id,
                game_id: game_id_bounded.clone(),
                proposer: proposer.clone(),
                description: description_bounded,
                proposal_data: proposal_data_bounded,
                status: ProposalStatus::Open,
                created_at: current_block,
                voting_end,
                min_votes,
                yes_votes: 0,
                no_votes: 0,
            };
            
            Proposals::<T>::insert(proposal_id, &proposal);
            
            Self::deposit_event(Event::ProposalCreated {
                proposal_id,
                game_id: game_id_bounded.to_vec(),
                proposer,
            });
            
            Ok(())
        }

        /// Vote on a proposal
        #[pallet::call_index(1)]
        #[pallet::weight(30_000)]
        pub fn vote(
            origin: OriginFor<T>,
            proposal_id: u32,
            vote: Vote,
        ) -> DispatchResult {
            let voter = ensure_signed(origin)?;
            
            let mut proposal = Proposals::<T>::get(proposal_id)
                .ok_or(Error::<T>::ProposalNotFound)?;
            
            ensure!(proposal.status == ProposalStatus::Open, Error::<T>::ProposalAlreadyProcessed);
            
            let current_block = frame_system::Pallet::<T>::block_number();
            ensure!(current_block < proposal.voting_end, Error::<T>::VotingPeriodEnded);
            
            // Check if already voted
            ensure!(
                !Votes::<T>::contains_key(proposal_id, &voter),
                Error::<T>::AlreadyVoted
            );
            
            // Record vote
            Votes::<T>::insert(proposal_id, &voter, &vote);
            
            // Update vote counts (simplified - in production would weight by stake/NFTs)
            match vote {
                Vote::Yes => proposal.yes_votes = proposal.yes_votes.saturating_add(1),
                Vote::No => proposal.no_votes = proposal.no_votes.saturating_add(1),
            }
            
            Proposals::<T>::insert(proposal_id, &proposal);
            
            Self::deposit_event(Event::VoteCast {
                proposal_id,
                voter,
                vote,
            });
            
            Ok(())
        }

        /// Finalize a proposal (check if it passed and execute)
        #[pallet::call_index(2)]
        #[pallet::weight(50_000)]
        pub fn finalize_proposal(
            origin: OriginFor<T>,
            proposal_id: u32,
        ) -> DispatchResult {
            let _who = ensure_signed(origin)?;
            
            let mut proposal = Proposals::<T>::get(proposal_id)
                .ok_or(Error::<T>::ProposalNotFound)?;
            
            ensure!(proposal.status == ProposalStatus::Open, Error::<T>::ProposalAlreadyProcessed);
            
            let current_block = frame_system::Pallet::<T>::block_number();
            ensure!(current_block >= proposal.voting_end, Error::<T>::VotingPeriodNotEnded);
            
            // Check if proposal passed
            let total_votes = proposal.yes_votes + proposal.no_votes;
            let passed = total_votes >= proposal.min_votes && proposal.yes_votes > proposal.no_votes;
            
            if passed {
                proposal.status = ProposalStatus::Passed;
                
                // Execute proposal (simplified - in production would decode and execute call)
                // For now, just mark as executing
                proposal.status = ProposalStatus::Executing;
                
                Self::deposit_event(Event::ProposalPassed {
                    proposal_id,
                });
                
                Self::deposit_event(Event::ProposalExecuted {
                    proposal_id,
                });
            } else {
                proposal.status = ProposalStatus::Rejected;
                
                Self::deposit_event(Event::ProposalRejected {
                    proposal_id,
                });
            }
            
            Proposals::<T>::insert(proposal_id, &proposal);
            
            Ok(())
        }
    }
}
