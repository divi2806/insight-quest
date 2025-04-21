import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction, 
  getAccount, 
  getMint,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import bs58 from 'bs58';

// Token mint address on Solana devnet
const TOKEN_MINT_ADDRESS = 'FGn3YwW5iMDe2Sz7ekYTV8ZvAdmQmzeSGpFEsAjHEQnm';
// Admin wallet address
const ADMIN_ADDRESS = 'EhFTWzaEXM9baSFSMM22cJiG8KjmsMLiFWi27DVc2Zq6';

// Get connection to Solana devnet
const getConnection = () => {
  return new Connection('https://api.devnet.solana.com', 'confirmed');
};

const TokenService = {
  // Get token balance for a user
  async getTokenBalance(walletAddress: string): Promise<number> {
    try {
      const connection = getConnection();
      const walletPublicKey = new PublicKey(walletAddress);
      const mintPublicKey = new PublicKey(TOKEN_MINT_ADDRESS);
      
      // Get the associated token account address
      const tokenAccountAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        walletPublicKey
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
  
  // Check if a user has an associated token account
  async hasTokenAccount(walletAddress: string): Promise<boolean> {
    try {
      const connection = getConnection();
      const walletPublicKey = new PublicKey(walletAddress);
      const mintPublicKey = new PublicKey(TOKEN_MINT_ADDRESS);
      
      // Get the associated token account address
      const tokenAccountAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        walletPublicKey
      );
      
      // Try to get the account info
      const accountInfo = await connection.getAccountInfo(tokenAccountAddress);
      
      // If account info exists, the user has a token account
      return accountInfo !== null;
    } catch (error) {
      console.error('Error checking token account:', error);
      return false;
    }
  },
  
  // Create an associated token account for a user
  async createTokenAccount(walletAddress: string): Promise<string> {
    try {
      if (!window.solana) throw new Error('No Solana wallet found');
      
      // Request wallet connection if not already connected
      await window.solana.connect();
      
      const connection = getConnection();
      const walletPublicKey = new PublicKey(walletAddress);
      const mintPublicKey = new PublicKey(TOKEN_MINT_ADDRESS);
      
      // Get the associated token account address
      const tokenAccountAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        walletPublicKey
      );
      
      // Create instruction to create the associated token account
      const createAccountInstruction = createAssociatedTokenAccountInstruction(
        walletPublicKey, // payer
        tokenAccountAddress, // associated token account
        walletPublicKey, // owner
        mintPublicKey // mint
      );
      
      // Create transaction and add the instruction
      const transaction = new Transaction().add(createAccountInstruction);
      
      // Set recent blockhash and fee payer
      transaction.feePayer = walletPublicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      
      // Request signature from the wallet
      const signedTransaction = await window.solana.signTransaction(transaction);
      
      // Send the signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      
      return tokenAccountAddress.toString();
    } catch (error: any) {
      console.error('Error creating token account:', error);
      throw new Error(error.message || 'Failed to create token account');
    }
  },
  
  // Enter a contest or purchase an agent by transferring tokens to admin wallet
  async enterContest(fromWalletAddress: string, amount: number): Promise<string> {
    try {
      // Validate Solana address format before proceeding
      if (!fromWalletAddress || typeof fromWalletAddress !== 'string') {
        throw new Error('Invalid Solana address format');
      }
      
      // Ensure we're using the correct admin address to receive tokens
      const toWalletAddress = ADMIN_ADDRESS;
      
      // Use the existing transferTokens function to handle the token transfer
      const signature = await this.transferTokens(fromWalletAddress, toWalletAddress, amount);
      return signature;
    } catch (error: any) {
      console.error('Error entering contest:', error);
      throw new Error(error.message || 'Failed to enter contest');
    }
  },
  
  // Transfer tokens from one user to another
  async transferTokens(
    fromWalletAddress: string, 
    toWalletAddress: string, 
    amount: number
  ): Promise<string> {
    try {
      if (!window.solana) throw new Error('No Solana wallet found');
      
      // Request wallet connection if not already connected
      await window.solana.connect();
      
      // Validate addresses
      if (!fromWalletAddress || typeof fromWalletAddress !== 'string') {
        throw new Error('Invalid sender address format');
      }
      
      if (!toWalletAddress || typeof toWalletAddress !== 'string') {
        throw new Error('Invalid receiver address format');
      }
      
      const connection = getConnection();
      
      // Create PublicKey objects from string addresses
      let fromPublicKey: PublicKey;
      let toPublicKey: PublicKey;
      
      try {
        fromPublicKey = new PublicKey(fromWalletAddress);
      } catch (e) {
        throw new Error('Invalid sender Solana address format');
      }
      
      try {
        toPublicKey = new PublicKey(toWalletAddress);
      } catch (e) {
        throw new Error('Invalid receiver Solana address format');
      }
      
      const mintPublicKey = new PublicKey(TOKEN_MINT_ADDRESS);
      
      // Get the associated token accounts for sender and receiver
      const fromTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        fromPublicKey
      );
      
      const toTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        toPublicKey
      );
      
      // Check if receiver has a token account
      const receiverHasAccount = await this.hasTokenAccount(toWalletAddress);
      
      // Get mint info to calculate amount with proper decimals
      const mintInfo = await getMint(connection, mintPublicKey);
      const amountToSend = Math.floor(amount * Math.pow(10, mintInfo.decimals));
      
      // Create transaction
      const transaction = new Transaction();
      
      // If receiver doesn't have a token account, create one
      if (!receiverHasAccount) {
        const createAccountInstruction = createAssociatedTokenAccountInstruction(
          fromPublicKey, // payer
          toTokenAccount, // associated token account
          toPublicKey, // owner
          mintPublicKey // mint
        );
        
        transaction.add(createAccountInstruction);
      }
      
      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromPublicKey,
        BigInt(amountToSend)
      );
      
      // Add transfer instruction to transaction
      transaction.add(transferInstruction);
      
      // Set recent blockhash and fee payer
      transaction.feePayer = fromPublicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      
      // Request signature from the wallet
      const signedTransaction = await window.solana.signTransaction(transaction);
      
      // Send the signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);
      
      return signature;
    } catch (error: any) {
      console.error('Error transferring tokens:', error);
      throw new Error(error.message || 'Failed to transfer tokens');
    }
  }
};

export default TokenService;