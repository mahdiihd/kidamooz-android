import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

export type BazaarPurchaseResult = {
  productId: string;
  purchaseToken: string;
  orderId?: string;
  packageName?: string;
  purchaseData?: string;
  dataSignature?: string;
};

@Injectable({ providedIn: 'root' })
export class BazaarBillingService {
  readonly supported = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  async purchase(productId: string): Promise<BazaarPurchaseResult> {
    if (!this.supported) {
      throw new Error('bazaarUnavailable');
    }

    const plugin = await this.loadPlugin();
    if (!plugin) {
      throw new Error('bazaarPluginMissing');
    }

    const rsaPublicKey =
      (window as unknown as { __BAZAAR_RSA_PUBLIC_KEY__?: string }).__BAZAAR_RSA_PUBLIC_KEY__ ?? '';
    await plugin.initialize({ rsaPublicKey });

    const result = (await plugin.purchaseProduct({ productId })) as {
      state?: string;
      purchase?: Record<string, string | undefined>;
    };
    if (result.state !== 'PURCHASED' || !result.purchase?.['purchaseToken']) {
      throw new Error('bazaarPurchaseFailed');
    }

    const purchase = result.purchase;
    return {
      productId,
      purchaseToken: String(purchase['purchaseToken']),
      orderId: purchase['orderId'],
      packageName: purchase['packageName'],
      purchaseData: purchase['originalJson'] ?? purchase['purchaseData'],
      dataSignature: purchase['dataSignature'] ?? purchase['signature'],
    };
  }

  async consume(purchaseToken: string): Promise<void> {
    const plugin = await this.loadPlugin();
    if (!plugin?.consumeProduct) {
      return;
    }
    await plugin.consumeProduct({ token: purchaseToken });
  }

  private async loadPlugin(): Promise<{
    initialize: (options: { rsaPublicKey: string }) => Promise<unknown>;
    purchaseProduct: (options: { productId: string }) => Promise<unknown>;
    consumeProduct?: (options: { token: string }) => Promise<unknown>;
  } | null> {
    try {
      const mod = (await import('@salarizadi/capacitor-cafebazaar-poolakey')) as unknown as {
        CafebazaarPoolakey?: {
          initialize: (options: { rsaPublicKey: string }) => Promise<unknown>;
          purchaseProduct: (options: { productId: string }) => Promise<unknown>;
          consumeProduct?: (options: { token: string }) => Promise<unknown>;
        };
      };
      return mod.CafebazaarPoolakey ?? null;
    } catch {
      return null;
    }
  }
}
