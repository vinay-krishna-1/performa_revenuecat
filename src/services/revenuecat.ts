import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_ENTITLEMENT_ID = 'create_an_app_called_performa_pro';

// Sandbox simulation keys — RC SDK is NOT configured in release builds.
// The guard at line ~29 skips Purchases.configure() when key contains 'mock'.
// Real production keys should be set via EXPO_PUBLIC_REVENUECAT_* env vars.
const API_KEYS = {
  apple: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || 'appl_mock_performa_key',
  google: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || 'goog_mock_performa_key',
};

export class SubscriptionService {
  private static instance: SubscriptionService;
  private isConfigured: boolean = false;
  private mockProActive: boolean = false;

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isConfigured) return;

    try {
      const apiKey = Platform.OS === 'ios' ? API_KEYS.apple : API_KEYS.google;
      if (apiKey && apiKey.trim().length > 5 && !apiKey.includes('mock')) {
        Purchases.configure({ apiKey: apiKey.trim() });
        this.isConfigured = true;
        console.log('[RevenueCat] Successfully configured SDK with live key');
      } else {
        // Safe sandbox fallback mode
        this.isConfigured = false;
        console.log('[RevenueCat] Operating in local sandbox / simulation mode');
      }
    } catch (e) {
      console.warn('[RevenueCat] Initialization fallback to local sandbox:', e);
      this.isConfigured = false;
    }
  }

  public isLive(): boolean {
    return this.isConfigured;
  }

  public async isProUser(): Promise<boolean> {
    if (this.mockProActive) return true;

    if (!this.isConfigured) {
      return this.mockProActive;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== undefined;
    } catch (e) {
      console.warn('[RevenueCat] Failed to fetch customer info:', e);
      return this.mockProActive;
    }
  }

  public async getProPackages(): Promise<PurchasesPackage[]> {
    if (!this.isConfigured) {
      // Return empty array if sandbox or keys missing
      return [];
    }

    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        return offerings.current.availablePackages;
      }
      return [];
    } catch (e) {
      console.warn('[RevenueCat] Failed to fetch offerings:', e);
      return [];
    }
  }

  public async purchasePackage(pkg: PurchasesPackage): Promise<{ success: boolean; error?: string }> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPro = customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== undefined;
      return { success: isPro };
    } catch (e: any) {
      if (e.userCancelled) {
        return { success: false, error: 'Purchase cancelled' };
      }
      return { success: false, error: e.message || 'Purchase failed' };
    }
  }

  public async restorePurchases(): Promise<{ success: boolean; isPro: boolean; error?: string }> {
    try {
      if (!this.isConfigured) {
        return { success: true, isPro: this.mockProActive };
      }
      const customerInfo = await Purchases.restorePurchases();
      const isPro = customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== undefined;
      return { success: true, isPro };
    } catch (e: any) {
      return { success: false, isPro: false, error: e.message || 'Restore failed' };
    }
  }

  /**
   * Sandbox simulator switch to allow instant testing of Pro features in dev builds / simulators.
   */
  public setMockProStatus(active: boolean) {
    this.mockProActive = active;
  }
}
