module musebot::supra_nft {
    // Aptos/Supra Framework modules
    use aptos_framework::event;
    use aptos_framework::signer;
    use aptos_std::table::{Self, Table};
    use aptos_std::string::{Self, String};
    use aptos_std::vector;
    use aptos_framework::timestamp; // <--- NEW: For accessing current block timestamp for pseudo-randomness

    // Removed Supra VRF module dependency for internal RNG
    // use supra_addr::supra_vrf; 

    /// Represents a Non-Fungible Token on the Supra Network.
    struct SupraNFT has key, store, drop {
        object_id: u64,
        ipfs_hash: String, // Changed from vector<u8> to String
        name: String,
        description: String,
        rarity: u256,
        owner: address,
    }

    #[event]
    /// Event emitted when a new NFT is minted.
    struct NFTMinted has drop, copy, store {
        object_id: u64,
        creator: address,
        name: String,
        ipfs_hash: String, // Changed from vector<u8> to String
        rarity: u256,
    }

    /// A resource to store the last requested nonce for minting.
    /// This resource will be stored at the module's address (publisher's address).
    struct LastNonce has key, store {
        nonce: u64,
        // Removed pending_mint_requests as dVRF callback is no longer needed
    }

    /// Removed PendingMintRequest struct as dVRF callback is no longer needed.
    // struct PendingMintRequest has store, copy, drop { ... }


    /// Initializes the module by creating and transferring the LastNonce resource to the publisher.
    /// This function is called AUTOMATICALLY on module PUBLICATION. It MUST be private.
    fun init_module(sender: &signer) {
        let sender_address = signer::address_of(sender);
        if (!exists<LastNonce>(sender_address)) {
            move_to(sender, LastNonce { nonce: 0 }); // No pending_mint_requests table
        }
    }

    /// Public entry function to mint a new NFT with pseudo-random rarity.
    public entry fun mint(
        sender: &signer,
        ipfs_hash: String, // Changed from vector<u8> to String
        name: String,
        description: String,
    ) acquires LastNonce {
        let sender_address = signer::address_of(sender);
        let last_nonce_obj = borrow_global_mut<LastNonce>(@musebot);

        // Increment nonce for the new request (and as NFT ID)
        last_nonce_obj.nonce = last_nonce_obj.nonce + 1;
        let current_nonce = last_nonce_obj.nonce;

        // Generate pseudo-random rarity using timestamp
        let current_timestamp_microseconds = timestamp::now_microseconds(); // Get current timestamp as u64
        let rarity: u256 = (current_timestamp_microseconds as u256) % 100; // Scale to 0-99 as u256

        // Create the NFT resource
        let nft = SupraNFT {
            object_id: current_nonce, // Simple incrementing ID for the NFT within this module
            ipfs_hash,
            name,
            description,
            rarity,
            owner: sender_address, // Minter is the owner
        };

        // The NFT is created as a resource and its existence is signaled by the emitted event.
        // Its ownership is implicitly tied to the event and the 'owner' field.

        event::emit(NFTMinted {
            object_id: nft.object_id,
            creator: sender_address, // Creator is the sender
            name: nft.name,
            ipfs_hash: nft.ipfs_hash,
            rarity,
        });
    }

    // Removed rng_callback function as dVRF is no longer used
    // public entry fun rng_callback(...) acquires LastNonce { ... }

    /// Public view function to get details of the LastNonce resource.
    /// Changed from `get_pending_mint_request` as that concept is no longer relevant.
    public fun get_last_nonce(): u64 acquires LastNonce {
        let last_nonce_obj = borrow_global<LastNonce>(@musebot);
        last_nonce_obj.nonce
    }
}
