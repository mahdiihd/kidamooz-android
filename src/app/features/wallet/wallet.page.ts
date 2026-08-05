import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cardOutline,
  chevronForwardOutline,
  diamondOutline,
  sparklesOutline,
  walletOutline,
} from 'ionicons/icons';

import { CreditPackage, MemberWallet } from '../../core/models/wallet.model';
import { BazaarBillingService } from '../../core/services/bazaar-billing.service';
import { MemberAuthService } from '../../core/services/member-auth.service';
import { WalletApiService } from '../../core/services/wallet-api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StarsBackgroundComponent } from '../../shared/components/stars-background/stars-background.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

addIcons({
  cardOutline,
  chevronForwardOutline,
  diamondOutline,
  sparklesOutline,
  walletOutline,
});

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    IonSpinner,
    PageHeaderComponent,
    StarsBackgroundComponent,
    TranslatePipe,
  ],
  templateUrl: './wallet.page.html',
  styleUrl: './wallet.page.scss',
})
export class WalletPage implements OnInit {
  private readonly api = inject(WalletApiService);
  private readonly bazaar = inject(BazaarBillingService);
  private readonly auth = inject(MemberAuthService);
  private readonly router = inject(Router);

  readonly wallet = signal<MemberWallet | null>(null);
  readonly loading = signal(true);
  readonly busyProductId = signal('');
  readonly error = signal('');
  readonly notice = signal('');
  readonly bazaarSupported = this.bazaar.supported;

  readonly balanceLabel = computed(() => {
    const balance = this.wallet()?.creditBalance ?? 0;
    return balance.toLocaleString('fa-IR');
  });

  readonly coverPriceLabel = computed(() => {
    const price = this.wallet()?.coverPriceTomans ?? 50_000;
    return price.toLocaleString('fa-IR');
  });

  ngOnInit(): void {
    if (!this.auth.loggedIn()) {
      void this.router.navigateByUrl('/auth/login');
      return;
    }
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getWallet().subscribe({
      next: (wallet) => {
        this.wallet.set(wallet);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('loadFailed');
        this.loading.set(false);
      },
    });
  }

  buy(pkg: CreditPackage): void {
    this.error.set('');
    this.notice.set('');
    if (!this.bazaarSupported) {
      this.notice.set('webHint');
      return;
    }

    this.busyProductId.set(pkg.productId);
    void this.runPurchase(pkg);
  }

  private async runPurchase(pkg: CreditPackage): Promise<void> {
    try {
      const purchase = await this.bazaar.purchase(pkg.productId);
      this.api.confirmBazaarPurchase(purchase).subscribe({
        next: async (wallet) => {
          this.wallet.set(wallet);
          this.notice.set('purchaseOk');
          try {
            await this.bazaar.consume(purchase.purchaseToken);
          } catch {
            /* ignore consume errors after credit granted */
          }
          this.busyProductId.set('');
        },
        error: () => {
          this.error.set('purchaseFailed');
          this.busyProductId.set('');
        },
      });
    } catch {
      this.error.set('purchaseFailed');
      this.busyProductId.set('');
    }
  }
}
