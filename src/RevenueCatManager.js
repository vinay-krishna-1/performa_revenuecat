import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { useState, useEffect, useCallback } from 'react';

export const REVENUECAT_API_KEY = 'test_IzCcdsjDcEfnMBMzdNumTMdUslJ';
export const ENTITLEMENT_ID = 'create_an_app_called_performa_pro';

// 5. Turn on debug logs so we can see the data pipeline flow in our terminal window
try {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
} catch (e) {
  console.warn('[RevenueCatManager] Could not set log level:', e);
}

let isConfigured = false;

/**
 * 2. Initialize the package by passing our real token: test_IzCcdsjDcEfnMBMzdNumTMdUslJ
 */
export const initRevenueCat = () => {
  // __DEV__ is true in debug/Expo builds only — never in release APKs.
  // This prevents the RevenueCat "Wrong API Key" blocking dialog in release builds.
  if (!isConfigured && __DEV__) {
    try {
      Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      isConfigured = true;
      console.log('[RevenueCatManager] Initialized with live credential token:', REVENUECAT_API_KEY);
    } catch (err) {
      console.error('[RevenueCatManager] Failed to configure Purchases SDK:', err);
    }
  }
};

/**
 * 3. Clean, isolated 'useRevenueCat' hook that exposes:
 *    - 'currentOffering' (to dynamically bind our mock dashboard product lists)
 *    - 'purchasePackage' (to trigger the native sandbox sheet when payment cards are tapped)
 *    - 'isPro' (a boolean state tracking engine that checks if the active entitlement 'create_an_app_called_performa_pro' is valid)
 */
export function useRevenueCat() {
  const [currentOffering, setCurrentOffering] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize and fetch offerings + customerInfo
  useEffect(() => {
    initRevenueCat();

    let isMounted = true;

    async function loadPipelineData() {
      try {
        console.log('[RevenueCatManager] Pipeline: Querying CustomerInfo and Offerings...');
        const [customerInfo, offerings] = await Promise.all([
          Purchases.getCustomerInfo().catch((err) => {
            console.warn('[RevenueCatManager] Pipeline: Error fetching CustomerInfo:', err);
            return null;
          }),
          Purchases.getOfferings().catch((err) => {
            console.warn('[RevenueCatManager] Pipeline: Error fetching Offerings:', err);
            return null;
          }),
        ]);

        if (isMounted) {
          if (customerInfo) {
            const hasPro = Boolean(
              customerInfo.entitlements?.active?.[ENTITLEMENT_ID] !== undefined
            );
            console.log(
              `[RevenueCatManager] Pipeline: Entitlement '${ENTITLEMENT_ID}' status: ${hasPro}`
            );
            setIsPro(hasPro);
          }

          if (offerings && offerings.current) {
            console.log(
              '[RevenueCatManager] Pipeline: Loaded current offering:',
              offerings.current.identifier,
              `(${offerings.current.availablePackages?.length || 0} packages)`
            );
            setCurrentOffering(offerings.current);
          } else if (offerings && offerings.all && Object.keys(offerings.all).length > 0) {
            const firstOffering = Object.values(offerings.all)[0];
            console.log(
              '[RevenueCatManager] Pipeline: Using fallback available offering:',
              firstOffering.identifier
            );
            setCurrentOffering(firstOffering);
          } else {
            console.log('[RevenueCatManager] Pipeline: No remote offerings configured yet.');
            setCurrentOffering(null);
          }
        }
      } catch (err) {
        console.error('[RevenueCatManager] Pipeline error loading data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPipelineData();

    // Real-time listener for customer updates
    const customerInfoUpdateListener = (info) => {
      if (isMounted && info) {
        const hasPro = Boolean(info.entitlements?.active?.[ENTITLEMENT_ID] !== undefined);
        console.log(`[RevenueCatManager] Pipeline: Realtime CustomerInfo update. isPro=${hasPro}`);
        setIsPro(hasPro);
      }
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoUpdateListener);

    return () => {
      isMounted = false;
      try {
        Purchases.removeCustomerInfoUpdateListener(customerInfoUpdateListener);
      } catch (_) {}
    };
  }, []);

  /**
   * Purchase handler: Triggers the native checkout sheet
   */
  const purchasePackage = useCallback(async (pkg) => {
    if (!pkg) {
      console.warn('[RevenueCatManager] purchasePackage called with no package parameter');
      return { success: false, error: 'No package selected' };
    }

    try {
      console.log(
        `[RevenueCatManager] Triggering native checkout sheet for: ${pkg.identifier || pkg.product?.identifier || 'package'}`
      );
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const hasPro = Boolean(customerInfo.entitlements?.active?.[ENTITLEMENT_ID] !== undefined);
      console.log(`[RevenueCatManager] Checkout complete. Entitlement '${ENTITLEMENT_ID}' valid: ${hasPro}`);
      setIsPro(hasPro);
      return { success: true, customerInfo, isPro: hasPro };
    } catch (err) {
      if (err?.userCancelled) {
        console.log('[RevenueCatManager] User cancelled native checkout sheet');
        return { success: false, userCancelled: true };
      }
      console.error('[RevenueCatManager] Checkout error:', err);
      return { success: false, error: err?.message || 'Transaction failed' };
    }
  }, []);

  return {
    currentOffering,
    purchasePackage,
    isPro,
    loading,
  };
}

export default {
  initRevenueCat,
  useRevenueCat,
  REVENUECAT_API_KEY,
  ENTITLEMENT_ID,
};
