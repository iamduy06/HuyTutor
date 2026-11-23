import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import {
  initGoogleAnalytics,
  disableGoogleAnalytics,
  trackPageView,
} from '../utils/analytics';

/**
 * Component quản lý vòng đời Google Analytics 4 và phát virtual pageview theo route SPA
 */
export const AnalyticsTracker: React.FC = () => {
  const { siteConfigs } = useStore();
  const location = useLocation();

  const gaConfig = siteConfigs?.google_analytics;

  // Quản lý việc nạp hoặc tắt script Google Analytics theo siteConfigs
  useEffect(() => {
    if (gaConfig && gaConfig.is_active && gaConfig.measurement_id?.trim()) {
      initGoogleAnalytics(gaConfig);
    } else {
      disableGoogleAnalytics(gaConfig?.measurement_id);
    }

    return () => {
      // Khi unmount hoàn toàn
    };
  }, [gaConfig?.is_active, gaConfig?.measurement_id, gaConfig?.gtm_id]);

  // Lắng nghe thay đổi đường dẫn (SPA Virtual Pageviews)
  useEffect(() => {
    if (!gaConfig || !gaConfig.is_active || !gaConfig.measurement_id?.trim()) {
      return;
    }

    // Nếu cấu hình có cờ track_pageviews và nó không bị tắt (mặc định bật)
    if (gaConfig.track_pageviews !== false) {
      const fullPath = location.pathname + location.search;
      trackPageView(fullPath, document.title);
    }
  }, [location.pathname, location.search, gaConfig?.is_active, gaConfig?.measurement_id, gaConfig?.track_pageviews]);

  return null;
};
