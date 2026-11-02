import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  formatVnd,
  OrderRecord,
  UiFormatCode,
  UserLibraryItem,
  UserSessionItem,
} from '../types';

type LibraryTab = 'library' | 'orders' | 'sessions' | 'profile';

function getSsoUrl(): string {
  const envUrl = import.meta.env.SSO_URL;
  if (envUrl) {
    return (envUrl as string).replace(/\/+$/, '');
  }
  return '';
}

export const MyLibraryPage: React.FC = () => {
  const { user, isAdmin, logout, logoutAllDevices, setUserState } = useAuth();
  const { showToast, products, setSampleModalProduct } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as LibraryTab) || 'library';
  const [activeTab, setActiveTab] = useState<LibraryTab>(
    ['library', 'orders', 'sessions', 'profile'].includes(initialTab)
      ? initialTab
      : 'library'
  );

  const [libraryItems, setLibraryItems] = useState<UserLibraryItem[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [formatFilter, setFormatFilter] = useState<'ALL' | UiFormatCode>('ALL');

  // Form hồ sơ
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [customerGroup, setCustomerGroup] = useState<
    'Giáo viên' | 'Học sinh' | 'Phụ huynh' | 'Khác'
  >(user?.customerGroup || 'Giáo viên');
  const [schoolOrOrg, setSchoolOrOrg] = useState(user?.schoolOrOrg || '');
  const [defaultTaxCccd, setDefaultTaxCccd] = useState(user?.defaultTaxCccd || '');
  const [defaultInvoiceAddress, setDefaultInvoiceAddress] = useState(
    user?.defaultInvoiceAddress || ''
  );
  const [savingProfile, setSavingProfile] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [libRes, ordRes, sessRes] = await Promise.all([
        apiClient.getUserLibrary(),
        apiClient.getUserOrders(),
        apiClient.getSessions(),
      ]);
      setLibraryItems(libRes.items);
      setOrders(ordRes.orders);
      setSessions(sessRes.sessions);
    } catch (err: any) {
      showToast(err?.message || 'Lỗi tải dữ liệu tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setCustomerGroup(user.customerGroup || 'Giáo viên');
      setSchoolOrOrg(user.schoolOrOrg || '');
      setDefaultTaxCccd(user.defaultTaxCccd || '');
      setDefaultInvoiceAddress(user.defaultInvoiceAddress || '');
    }
  }, [user]);

  const handleSelectTab = (tab: LibraryTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleRevokeSession = async (sessionId: string, isCurrent: boolean) => {
    try {
      if (isCurrent) {
        await logout();
        showToast('Đã đăng xuất phiên hiện tại.');
        return;
      }
      const res = await apiClient.revokeSession(sessionId);
      showToast(res.message);
      const sessRes = await apiClient.getSessions();
      setSessions(sessRes.sessions);
    } catch (err: any) {
      showToast(err?.message || 'Không thể thu hồi phiên đăng nhập.');
    }
  };

  const handleRevokeAllSessions = async () => {
    await logoutAllDevices();
    showToast('Đã thu hồi toàn bộ phiên đăng nhập trên mọi thiết bị.');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await apiClient.updateUserProfile({
        fullName,
        phone,
        customerGroup,
        schoolOrOrg,
        defaultTaxCccd,
        defaultInvoiceAddress,
      });
      setUserState(res.user);
      showToast(res.message);
    } catch (err: any) {
      showToast(err?.message || 'Lỗi lưu thông tin hồ sơ.');
    } finally {
      setSavingProfile(false);
    }
  };

  const filteredLibrary =
    formatFilter === 'ALL'
      ? libraryItems
      : libraryItems.filter((item) => item.format_code === formatFilter);

  return (
    <main className="max-w-[1180px] mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#fff5f7] border border-pink-200 rounded-md p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-extrabold text-[#e60049] uppercase tracking-wider">
            TÀI KHOẢN HỌC TẬP &amp; GIẢNG DẠY • HUY TUTOR
          </div>
          <h1 className="text-base sm:text-lg font-extrabold text-gray-900 mt-0.5">
            Xin chào, {user?.fullName}{' '}
            <span className="inline-block ml-1.5 px-2 py-0.5 text-[10px] font-bold uppercase bg-[#e60049] text-white rounded-sm">
              {user?.role === 'admin' ? 'Admin' : user?.customerGroup || 'Thành viên'}
            </span>
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Gmail nhận tài liệu: <strong>{user?.email}</strong> • Thiết bị đang hoạt động:{' '}
            <strong>{sessions.length} phiên</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-3.5 py-2 rounded-sm transition"
            >
              Mở Trang Quản trị
            </Link>
          )}
          <button
            type="button"
            onClick={() => logout()}
            className="border border-gray-300 bg-white hover:border-[#e60049] hover:text-[#e60049] text-gray-700 font-bold text-xs px-3.5 py-2 rounded-sm transition"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => handleSelectTab('library')}
          className={`px-4 py-2 rounded-sm text-xs font-bold transition ${
            activeTab === 'library'
              ? 'bg-[#e60049] text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-[#e60049]'
          }`}
        >
          Tủ sách đã mua ({libraryItems.length})
        </button>
        <button
          type="button"
          onClick={() => handleSelectTab('orders')}
          className={`px-4 py-2 rounded-sm text-xs font-bold transition ${
            activeTab === 'orders'
              ? 'bg-[#e60049] text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-[#e60049]'
          }`}
        >
          Lịch sử đơn hàng ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => handleSelectTab('sessions')}
          className={`px-4 py-2 rounded-sm text-xs font-bold transition ${
            activeTab === 'sessions'
              ? 'bg-[#e60049] text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-[#e60049]'
          }`}
        >
          Quản lý Phiên đăng nhập ({sessions.length})
        </button>
        <button
          type="button"
          onClick={() => handleSelectTab('profile')}
          className={`px-4 py-2 rounded-sm text-xs font-bold transition ${
            activeTab === 'profile'
              ? 'bg-[#e60049] text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-[#e60049]'
          }`}
        >
          Hồ sơ &amp; Đổi mật khẩu
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-500">
          Đang đồng bộ dữ liệu từ hệ thống...
        </div>
      ) : (
        <>
          {/* TAB 1: TỦ SÁCH CÁ NHÂN */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {(['ALL', 'Word', 'PDF', 'Flashcard'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormatFilter(fmt)}
                      className={`px-3 py-1.5 rounded-sm text-xs font-bold transition ${
                        formatFilter === fmt
                          ? 'bg-[#e60049] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {fmt === 'ALL' ? 'Tất cả định dạng' : fmt}
                    </button>
                  ))}
                </div>
                <Link
                  to="/"
                  className="text-xs font-bold text-[#e60049] hover:underline"
                >
                  Khám phá thêm tài liệu mới
                </Link>
              </div>

              {filteredLibrary.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-md p-8 text-center space-y-3">
                  <div className="text-sm font-bold text-gray-800">
                    Chưa có tài liệu nào trong danh mục này
                  </div>
                  <p className="text-xs text-gray-600 max-w-md mx-auto">
                    Ngay sau khi đơn hàng của bạn được xác nhận thanh toán thành công, toàn bộ
                    tài liệu đã mua sẽ tự động xuất hiện tại đây.
                  </p>
                  <div className="pt-1">
                    <Link
                      to="/"
                      className="inline-block bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-4 py-2 rounded-sm transition"
                    >
                      Xem danh mục tài liệu
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLibrary.map((item) => {
                    const matchedProd = products.find(
                      (p) =>
                        p.slug === item.product_slug ||
                        p.id === item.product_slug ||
                        p.title === item.product_title
                    );
                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="bg-[#e60049] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                              {item.format_code}
                            </span>
                            <span className="text-[11px] text-gray-500 font-semibold">
                              Mã đơn: {item.order_code}
                            </span>
                          </div>
                          <h3 className="text-xs font-extrabold text-gray-900 leading-snug">
                            {item.product_title}
                          </h3>
                          <p className="text-[11px] text-gray-500">
                            Cấp quyền ngày:{' '}
                            {new Date(item.granted_at).toLocaleDateString('vi-VN')}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                          {item.access_drive_url ? (
                            <a
                              href={item.access_drive_url}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-3 py-1.5 rounded-sm transition"
                            >
                              Mở Google Drive
                            </a>
                          ) : matchedProd ? (
                            <button
                              type="button"
                              onClick={() => setSampleModalProduct(matchedProd)}
                              className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-3 py-1.5 rounded-sm transition"
                            >
                              Xem bản đọc thử
                            </button>
                          ) : null}

                          {matchedProd && (
                            <Link
                              to={`/${matchedProd.category_slug}/${matchedProd.slug}`}
                              className="border border-gray-300 text-gray-700 hover:border-[#e60049] hover:text-[#e60049] font-bold text-xs px-3 py-1.5 rounded-sm transition"
                            >
                              Chi tiết tài liệu
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LỊCH SỬ ĐƠN HÀNG */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm overflow-x-auto">
              {orders.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500">
                  Bạn chưa có đơn hàng nào gắn với tài khoản này.
                </div>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-200">
                      <th className="p-2.5 text-left">Mã đơn</th>
                      <th className="p-2.5 text-left">Tài liệu đặt mua</th>
                      <th className="p-2.5 text-left">Định dạng</th>
                      <th className="p-2.5 text-right">Tổng thanh toán</th>
                      <th className="p-2.5 text-center">Trạng thái</th>
                      <th className="p-2.5 text-left">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => (
                      <tr key={ord.id} className="border-b border-gray-100">
                        <td className="p-2.5 font-extrabold text-[#e60049]">
                          {ord.order_code}
                        </td>
                        <td className="p-2.5">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="font-medium text-gray-800">
                              • {it.product_title} (x{it.quantity})
                            </div>
                          ))}
                        </td>
                        <td className="p-2.5 font-bold">{ord.selected_format}</td>
                        <td className="p-2.5 text-right font-extrabold text-gray-900">
                          {formatVnd(ord.total_amount)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                              ord.payment_status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ord.payment_status === 'paid'
                              ? 'ĐÃ THANH TOÁN'
                              : 'CHỜ THANH TOÁN'}
                          </span>
                        </td>
                        <td className="p-2.5 text-gray-500">
                          {new Date(ord.created_at).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 3: QUẢN LÝ PHIÊN ĐĂNG NHẬP (SESSIONS) */}
          {activeTab === 'sessions' && (
            <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-[#e60049] uppercase">
                    Các thiết bị &amp; Phiên đăng nhập đang hoạt động
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Kiểm tra và thu hồi quyền truy cập trên các thiết bị lạ bất kỳ lúc nào.
                  </p>
                </div>
                {sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={handleRevokeAllSessions}
                    className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-3.5 py-2 rounded-sm transition"
                  >
                    Đăng xuất toàn bộ thiết bị
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className={`p-3.5 rounded-md border flex flex-wrap items-center justify-between gap-3 ${
                      sess.isCurrent
                        ? 'border-[#e60049] bg-[#fff5f7]'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">
                          {sess.userAgent}
                        </span>
                        {sess.isCurrent && (
                          <span className="bg-[#e60049] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                            Thiết bị hiện tại
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        IP: <strong>{sess.ipAddress || '127.0.0.1'}</strong> • Đăng nhập lúc:{' '}
                        {new Date(sess.createdAt).toLocaleString('vi-VN')} • Hoạt động gần
                        nhất: {new Date(sess.lastActiveAt).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRevokeSession(sess.id, sess.isCurrent)}
                      className="border border-[#e60049] text-[#e60049] hover:bg-[#e60049] hover:text-white font-bold text-xs px-3 py-1.5 rounded-sm transition"
                    >
                      {sess.isCurrent ? 'Đăng xuất phiên này' : 'Thu hồi phiên'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HỒ SƠ CÁ NHÂN & ĐỔI MẬT KHẨU */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Cột trái: Thông tin cá nhân & Hóa đơn */}
              <form
                onSubmit={handleSaveProfile}
                className="lg:col-span-7 bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-3.5"
              >
                <h2 className="text-sm font-extrabold text-[#e60049] uppercase border-b border-gray-100 pb-2">
                  Thông tin cá nhân &amp; Xuất hóa đơn mặc định
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Số điện thoại / Zalo
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Đối tượng khách hàng
                    </label>
                    <select
                      value={customerGroup}
                      onChange={(e) =>
                        setCustomerGroup(
                          e.target.value as 'Giáo viên' | 'Học sinh' | 'Phụ huynh' | 'Khác'
                        )
                      }
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#e60049]"
                    >
                      <option value="Giáo viên">Giáo viên</option>
                      <option value="Học sinh">Học sinh</option>
                      <option value="Phụ huynh">Phụ huynh</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Trường học / Cơ quan công tác
                    </label>
                    <input
                      type="text"
                      value={schoolOrOrg}
                      onChange={(e) => setSchoolOrOrg(e.target.value)}
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Mã số thuế / CCCD mặc định
                    </label>
                    <input
                      type="text"
                      value={defaultTaxCccd}
                      onChange={(e) => setDefaultTaxCccd(e.target.value)}
                      placeholder="Tự động điền khi cần xuất hóa đơn VAT"
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Địa chỉ xuất hóa đơn mặc định
                    </label>
                    <input
                      type="text"
                      value={defaultInvoiceAddress}
                      onChange={(e) => setDefaultInvoiceAddress(e.target.value)}
                      placeholder="Địa chỉ cơ quan hoặc cá nhân"
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-5 py-2.5 rounded-sm transition"
                >
                  {savingProfile ? 'Đang lưu...' : 'Lưu thông tin hồ sơ'}
                </button>
              </form>

              {/* Cột phải: Đổi mật khẩu qua SSO */}
              <div className="lg:col-span-5 bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-3.5">
                <h2 className="text-sm font-extrabold text-[#e60049] uppercase border-b border-gray-100 pb-2">
                  Đổi mật khẩu bảo mật
                </h2>
                <div className="pt-2">
                  <a
                    href={`${getSsoUrl()}/change-password?redirect=${encodeURIComponent(
                      typeof window !== 'undefined' ? window.location.href : ''
                    )}`}
                    className="inline-flex items-center gap-2 bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-5 py-2.5 rounded-sm transition"
                  >
                    <span>Sử dụng SSO portal để đổi mật khẩu của bạn</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
};
