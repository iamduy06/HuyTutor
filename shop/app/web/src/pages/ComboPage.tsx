import React, { useMemo } from 'react';
import {
  buildInitialComboBlocks,
  ComboBannerBlock,
  ComboBottomCtaBlock,
  ComboHeroBlock,
  ComboNoticeBlock,
  ComboPackagesBlock,
  ComboSectionsBlock,
} from '../components/DynamicComboBlocks';
import { useStore } from '../context/StoreContext';
import {
  ComboBannerBlockConfig,
  ComboBottomCtaBlockConfig,
  ComboHeroBlockConfig,
  ComboNoticeBlockConfig,
  ComboPackageItem,
  ComboPackagesBlockConfig,
  ComboSectionsBlockConfig,
  Product,
  UiFormatCode,
} from '../types';

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
    <div className="pb-12">
      {blocks
        .filter((b) => b.is_active !== false)
        .map((block) => {
          switch (block.type) {
            case 'combo_hero':
              return (
                <ComboHeroBlock
                  key={block.id}
                  config={block.config as ComboHeroBlockConfig}
                  onActionClick={handleSelectFirstCombo}
                />
              );

            case 'combo_packages':
              return (
                <main key={block.id} className="max-w-[920px] mx-auto px-4 py-4 space-y-10">
                  <ComboPackagesBlock
                    config={block.config as ComboPackagesBlockConfig}
                    allProducts={products}
                    onSelectPackage={handleSelectPackage}
                  />
                </main>
              );

            case 'combo_sections':
              return (
                <main key={block.id} className="max-w-[920px] mx-auto px-4 py-4 space-y-10">
                  <ComboSectionsBlock
                    config={block.config as ComboSectionsBlockConfig}
                    allProducts={products}
                  />
                </main>
              );

            case 'combo_bottom_cta':
              return (
                <ComboBottomCtaBlock
                  key={block.id}
                  config={block.config as ComboBottomCtaBlockConfig}
                  onActionClick={handleSelectFirstCombo}
                />
              );

            case 'combo_banner':
              return (
                <main key={block.id} className="max-w-[920px] mx-auto px-4">
                  <ComboBannerBlock config={block.config as ComboBannerBlockConfig} />
                </main>
              );

            case 'combo_notice':
              return (
                <main key={block.id} className="max-w-[920px] mx-auto px-4">
                  <ComboNoticeBlock config={block.config as ComboNoticeBlockConfig} />
                </main>
              );

            default:
              return null;
          }
        })}
    </div>
  );
};
