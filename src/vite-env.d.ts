/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Devnet SPL reward mint address */
  readonly VITE_REWARD_MINT?: string;
  /** Treasury wallet public key (redeem destination; teacher send when connected as this wallet) */
  readonly VITE_TREASURY_PUBKEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
