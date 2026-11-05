import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { buildProductUrl } from '../utils/urlHelper';
import { WatermarkViewer } from './WatermarkViewer';

export const SampleModal: React.FC = () => {
  const { sampleModalProduct, setSampleModalProduct } = useStore();

  if (!sampleModalProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 overflow-y-auto">
      <div className="bg-white rounded-md border border-gray-200 shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        <div className="bg-[#e60049] text-white px-5 py-3.5 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-extrabold uppercase">
              Đọc thử nhanh: {sampleModalProduct.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={buildProductUrl(sampleModalProduct.category_slug, sampleModalProduct.slug)}
              onClick={() => setSampleModalProduct(null)}
              className="px-2.5 py-1 bg-white text-[#e60049] font-bold text-xs rounded-sm hover:bg-gray-100"
            >
              Xem trang chi tiết
            </Link>
            <button
              type="button"
              onClick={() => setSampleModalProduct(null)}
              className="px-2.5 py-1 bg-black/20 text-white font-bold text-xs rounded-sm hover:bg-black/30"
            >
              Đóng
            </button>
          </div>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto">
          <WatermarkViewer product={sampleModalProduct} />
        </div>
      </div>
    </div>
  );
};

