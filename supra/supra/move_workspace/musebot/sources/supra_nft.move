module musebot::supra_nft {

    use aptos_framework::event;               // For emitting events
    use aptos_framework::signer;              // For getting sender address from signer
    use aptos_std::table::{Self, Table};      // Standard library for tables
    use aptos_std::string::{Self, String};    // Standard library for strings
    use aptos_std::vector;                    // Standard library for vectors
    use supra_addr::supra_vrf; 
    
    /// Represents a Non-Fungible Token on the Supra Network.
    /// In Aptos, objects with `key` are stored under an address.
    struct SupraNFT has key, store, drop { 
        object_id: u64, // A simple ID, managed by the contract
        ipfs_hash: vector<u8>, // IPFS Content Identifier (CID)
        name: String,
        description: String,
        rarity: u256, 
        owner: address, // The current owner of the NFT
    }

    #[event] // <--- FIXED: Moved #[event] attribute before documentation comment
    /// Event emitted when a new NFT is minted.
    struct NFTMinted has drop, copy, store { // ADD `store` ability here, crucial for event::emit
        object_id: u64, // Change to u64 consistent with SupraNFT
        creator: address,
        name: String,
        ipfs_hash: vector<u8>,
        rarity: u256, 
    }

    /// A resource to store the last requested nonce for dVRF callbacks and pending mint requests.
    /// This resource will be stored at the module's address (publisher's address).
    struct LastNonce has key, store { // Add `store` ability if it's going to be stored globally
        nonce: u64,
        pending_mint_requests: Table<u64, PendingMintRequest>, // Map nonce to request details
    }

    /// Stores details for a pending mint request awaiting dVRF callback.
    /// Added `copy` ability as it is returned by value from `get_pending_mint_request` and removed from table.
    struct PendingMintRequest has store, copy, drop { // <--- FIXED: Added `drop` ability
        recipient: address,
        ipfs_hash: vector<u8>,
        name: String,
        description: String,
    }

    /// Initializes the module by creating and transferring the LastNonce resource to the publisher.
    fun init_module(sender: &signer) {
        let sender_address = signer::address_of(sender);
        // Using global `exists<T>(addr)`
        if (!exists<LastNonce>(sender_address)) {
            // Using global `move_to(signer, resource)`
            move_to(sender, LastNonce { nonce: 0, pending_mint_requests: table::new() });
        }
    }

    /// Public entry function to request a new NFT mint.
    public entry fun mint(
        sender: &signer,
        ipfs_hash: vector<u8>,
        name: String,
        description: String,
    ) acquires LastNonce { // `acquires` is for resources that are stored directly under the *current module's address*
        let sender_address = signer::address_of(sender);
        // The `LastNonce` resource is at the module's publisher address, which is `@musebot` itself.
        // Using global `borrow_global_mut<T>(addr)`
        let last_nonce_obj = borrow_global_mut<LastNonce>(@musebot);

        // Increment nonce for the new request
        last_nonce_obj.nonce = last_nonce_obj.nonce + 1;
        let current_nonce = last_nonce_obj.nonce;

        // Store pending mint request details, associated with the current nonce
        table::add(&mut last_nonce_obj.pending_mint_requests, current_nonce, PendingMintRequest {
            recipient: sender_address,
            ipfs_hash,
            name,
            description,
        });

        // Request random number from dVRF
        // Using `supra_vrf::rng_request`. This requires `supra_addr::supra_vrf` to be correctly imported and bound.
        supra_vrf::rng_request(
            sender, // The signer of the transaction
            @musebot, // The address where this module is deployed
            string::utf8(b"supra_nft"), // Module name (this module)
            string::utf8(b"rng_callback"), // Callback function name
            1, // Request 1 random number
            current_nonce, // Use nonce as client seed for traceability
            1, // Number of block confirmations (adjust as needed for testnet stability)
        );
    }

    /// Callback function invoked by the dVRF service with the random number.
    public entry fun rng_callback(
        _sender: &signer, // <--- FIXED: Renamed to _sender to silence unused warning
        nonce: u64,
        message: vector<u8>,
        signature: vector<u8>,
        caller_address: address, // This will be the dVRF contract address (e.g., 0x1)
        rng_count: u8,
        client_seed: u64, // This will be our original nonce from the mint request
    ) acquires LastNonce { // `acquires` for resources directly at the module's address
        // Validate the callback signature and get the random number list
        // Using `supra_vrf::verify_callback`. This requires `supra_addr::supra_vrf` to be correctly imported and bound.
        let verified_numbers: vector<u256> = supra_vrf::verify_callback(
            nonce,
            message,
            signature,
            caller_address,
            rng_count,
            client_seed,
        );

        // Retrieve the pending mint request using the client_seed (which was our nonce)
        // Using global `borrow_global_mut<T>(addr)`
        let last_nonce_obj = borrow_global_mut<LastNonce>(@musebot);
        // Ensure type annotation for pending_request is explicit as `table::remove` returns the value directly
        let pending_request: PendingMintRequest = table::remove(&mut last_nonce_obj.pending_mint_requests, client_seed);

        // Calculate rarity from the first random number
        assert!(vector::length(&verified_numbers) > 0, 0); // Ensure at least one random number
        let random_number: u256 = *vector::borrow(&verified_numbers, 0);

        let rarity: u256 = (random_number % 100) + 1; // Rarity is u256 as per request

        // Create the NFT resource
        let nft_current_id = last_nonce_obj.nonce; // Use current nonce or a dedicated counter for NFT ID
        let nft = SupraNFT {
            object_id: nft_current_id, // Simple incrementing ID for the NFT within this module
            ipfs_hash: pending_request.ipfs_hash,
            name: pending_request.name,
            description: pending_request.description,
            rarity,
            owner: pending_request.recipient, // Original minter is the owner
        };

        // Transferring the NFT by simply emitting an event.
        // Direct `account::deposit` for generic resources is typically not how NFTs are transferred in Aptos.
        // A full token standard would handle the actual on-chain transfer.
        // For hackathon, the event and `owner` field signal creation and intended ownership.

        // Emit an event for frontend observability
        event::emit(NFTMinted {
            object_id: nft.object_id, // Use the u64 ID we assigned
            creator: pending_request.recipient,
            name: pending_request.name,
            ipfs_hash: pending_request.ipfs_hash,
            rarity,
        });
    }

    // Public view function to get details of a minted NFT by its ID.
    // This function remains a placeholder. Direct on-chain lookup of account-owned objects by ID
    // is not straightforward without a global registry or querying an account's resources.
    // For a hackathon, relying on events is the most practical way for the frontend to track NFTs.
    public fun get_pending_mint_request(client_seed: u64): PendingMintRequest acquires LastNonce {
        // This function could be called to check the status of a pending request.
        // Using global `borrow_global<T>(addr)`
        let last_nonce_obj = borrow_global<LastNonce>(@musebot);
        *table::borrow(&last_nonce_obj.pending_mint_requests, client_seed)
    }
}