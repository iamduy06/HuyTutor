import React, { useMemo } from 'react';
import { buildInitialComboBlocks } from '../components/DynamicComboBlocks';
import { UniversalBlockRenderer } from '../components/UniversalBlockRenderer';
import { useStore } from '../context/StoreContext';
import { ComboPackageItem, ComboPackagesBlockConfig, Product, UiFormatCode } from '../types';

export const ComboPage: React.FC = () => {
  const { products, siteConfigs, addToCart, setIsCartOpen } = useStore();

  const blocks = useMemo(() => {
    return buildInitialComboBlocks(products, siteConfigs?.combo_page_blocks);
  }, [products, siteConfigs?.combo_page_blocks]);

  const handleSelectPackage = (pkg: ComboPackageItem) => {
    const pkgProducts = (pkg.product_ids || [])
      .map((id) => products.find((p) => p.id === id || p.slug === id))
      .filter(Boolean) as Product[];

    const list = pkgProducts.length > 0 ? pkgProducts : products.slice(0, 3);
    const format: UiFormatCode = pkg.format_badge?.toLowerCase().includes('pdf')
      ? 'PDF'
      : 'Word';

    for (const prod of list) {
      addToCart(prod, format, 1);
    }
    setIsCartOpen(true);
  };

  const handleSelectFirstCombo = () => {
    const packagesBlock = blocks.find((b) => b.type === 'combo_packages');
    const packagesConfig = packagesBlock?.config as ComboPackagesBlockConfig | undefined;
    if (packagesConfig?.packages && packagesConfig.packages.length > 0) {
      handleSelectPackage(packagesConfig.packages[0]);
    } else {
      const defaultList = products.slice(0, 3);
      for (const prod of defaultList) {
        addToCart(prod, 'Word', 1);
      }
      setIsCartOpen(true);
    }
  };

  return (
    <div className="pb-12 space-y-6">
      <UniversalBlockRenderer
        blocks={blocks}
        context={{
          pageType: 'combo',
          allProducts: products,
        }}
        onOpenComboCheckout={handleSelectPackage}
        onTriggerComboBuy={handleSelectFirstCombo}
      />
    </div>
  );
};
