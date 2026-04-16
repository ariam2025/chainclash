module initia_brawlers::native_coin {
    use std::string;
    use initia_std::coin;

    /// Transfer the native token (uinit)
    public fun transfer(sender: &signer, recipient: address, amount: u64) {
        let metadata = coin::metadata(@initia_std, string::utf8(b"uinit"));
        coin::transfer(sender, recipient, metadata, amount);
    }
}
