export interface CreditPackage {
  productId: string;
  amountTomans: number;
  titleFa: string;
}

export interface MemberWallet {
  creditBalance: number;
  isPlus: boolean;
  freeAiCoverUsed: boolean;
  coverPriceTomans: number;
  packages: CreditPackage[];
}
