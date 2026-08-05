import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { CreditPackage, MemberWallet } from '../models/wallet.model';
import { sanitizePlainText } from '../utils/sanitize.util';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class WalletApiService {
  private readonly api = inject(ApiService);

  getWallet(): Observable<MemberWallet> {
    return this.api
      .get<MemberWallet & Record<string, unknown>>('/api/v1/me/wallet')
      .pipe(map((raw) => this.normalize(raw)));
  }

  confirmBazaarPurchase(payload: {
    productId: string;
    purchaseToken: string;
    orderId?: string;
    packageName?: string;
    purchaseData?: string;
    dataSignature?: string;
  }): Observable<MemberWallet> {
    return this.api
      .post<MemberWallet & Record<string, unknown>>('/api/v1/me/wallet/bazaar/confirm', payload)
      .pipe(map((raw) => this.normalize(raw)));
  }

  private normalize(raw: MemberWallet & Record<string, unknown>): MemberWallet {
    const packagesRaw =
      (raw.packages as CreditPackage[] | undefined) ??
      (raw['Packages'] as CreditPackage[] | undefined) ??
      [];
    return {
      creditBalance: Number(raw.creditBalance ?? raw['CreditBalance'] ?? 0),
      isPlus: Boolean(raw.isPlus ?? raw['IsPlus']),
      freeAiCoverUsed: Boolean(raw.freeAiCoverUsed ?? raw['FreeAiCoverUsed']),
      coverPriceTomans: Number(raw.coverPriceTomans ?? raw['CoverPriceTomans'] ?? 50_000),
      packages: packagesRaw.map((item) => {
        const row = item as CreditPackage & Record<string, unknown>;
        return {
          productId: String(row.productId ?? row['ProductId'] ?? ''),
          amountTomans: Number(row.amountTomans ?? row['AmountTomans'] ?? 0),
          titleFa: sanitizePlainText(String(row.titleFa ?? row['TitleFa'] ?? ''), 120),
        };
      }),
    };
  }
}
