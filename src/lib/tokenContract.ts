import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getAccount, getMint } from '@solana/spl-token';

// Your custom token contract address on Solana devnet
const TOKEN_MINT_ADDRESS = 'FGn3YwW5iMDe2Sz7ekYTV8ZvAdmQmzeSGpFEsAjHEQnm';
// The address where contest entry fees should be sent
const RECEIVER_ADDRESS = 'EhFTWzaEXM9baSFSMM22cJiG8KjmsMLiFWi27DVc2Zq6';

// Devnet connection
const getConnection = () => {
  return new Connection('https://api.devnet.solana.com', 'confirmed');
};

// Helper function to check if a string is a valid Solana address
const isValidSolanaAddress = (address: string): boolean => {
  try {
    if (!address) {
      console.error('Empty address provided');
      return false;
    }
    
    // Only trim whitespace without changing case
    const cleanAddress = address.trim();
    
    // Validate as Solana public key
    new PublicKey(cleanAddress);
    return true;
  } catch (error) {
    console.error('Invalid Solana address format:', error, 'Address:', address);
    return false;
  }
};

export const TokenService = {
  // Get the token balance for a user
  async getTokenBalance(userAddress: string): Promise<number> {
    try {
      if (!userAddress) return 0;
      
      // Check if the address is a valid Solana address
      if (!isValidSolanaAddress(userAddress)) {
        console.error('Invalid Solana address format');
        return 0;
      }
      
      const connection = getConnection();
      const userPublicKey = new PublicKey(userAddress);
      const mintPublicKey = new PublicKey(TOKEN_MINT_ADDRESS);
      
      // Get the associated token account address
      const tokenAccountAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        userPublicKey
      );
      
      try {
        // Get token account info
        const tokenAccount = await getAccount(connection, tokenAccountAddress);
        
        // Get mint info to get decimals
        const mintInfo = await getMint(connection, mintPublicKey);
        
        // Calculate actual balance with decimals
        const balance = Number(tokenAccount.amount) / Math.pow(10, mintInfo.decimals);
        return balance;
      } catch (error) {
        // If the account doesn't exist, return 0
        console.log('Token account not found, balance is 0');
        return 0;
      }
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  },
  
  // Transfer tokens for contest entry
  async enterContest(userAddress: string, amount: number): Promise<string> {
    try {
      if (!window.solana) throw new Error('No Solana wallet found');
      
      // First trim whitespace but preserve case
      
      // Check if the address is a valid Solana address
      if (!isValidSolanaAddress(userAddress)) {
        throw new Error(`Invalid Solana address format: ${userAddress}`);
      }
      
      // Ensure the wallet is connected
      try {
        await window.solana.connect();
      } catch (err) {
        console.log('Connection request was rejected or failed');
        throw new Error('Please connect your Solana wallet first');
      }
      
      const connection = getConnection();
      const userPublicKey = new PublicKey(userAddress);
      const receiverPublicKey = new PublicKey(RECEIVER_ADDRESS);
      const mintPublicKey = new PublicKey(TOKEN_MINT_ADDRESS);
      
      // Get the associated token accounts for sender and receiver
      const senderTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        userPublicKey
      );
      
      const receiverTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        receiverPublicKey
      );
      
      // Get mint info to calculate amount with proper decimals
      const mintInfo = await getMint(connection, mintPublicKey);
      const amountToSend = Math.floor(amount * Math.pow(10, mintInfo.decimals));
      
      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        senderTokenAccount,
        receiverTokenAccount,
        userPublicKey,
        BigInt(amountToSend)
      );
      
      // Create transaction and add the transfer instruction
      const transaction = new Transaction().add(transferInstruction);
      
      // Set recent blockhash and fee payer
      transaction.feePayer = userPublicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      
      // Request signature from the wallet
      const signedTransaction = await window.solana.signTransaction(transaction);
      
      // Send the signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      
      return signature;
    } catch (error: any) {
      console.error('Error entering contest:', error);
      throw new Error(error.message || 'Failed to process transaction');
    }
  }
};

export default TokenService;
