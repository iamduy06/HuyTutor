import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
    login,
    register,
  } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [customerGroup, setCustomerGroup] = useState<
    'Giáo viên' | 'Học sinh' | 'Phụ huynh' | 'Khác'
  >('Giáo viên');
  const [schoolOrOrg, setSchoolOrOrg] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const switchTab = (tab: 'login' | 'register' | 'forgot') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    openAuthModal(tab);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const loggedUser = await login(email.trim(), password);
      showToast(`Xin chào ${loggedUser.fullName}!`);
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng nhập không thành công.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không khớp.');
      return;
    }

    setSubmitting(true);
    try {
      const newUser = await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        customerGroup,
        schoolOrOrg: schoolOrOrg.trim(),
      });
      showToast(`Đăng ký thành công! Chào mừng ${newUser.fullName}.`);
      navigate('/my-library');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng ký tài khoản không thành công.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const res = await apiClient.forgotPassword(email.trim());
      setSuccessMsg(res.message);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể gửi yêu cầu khôi phục mật khẩu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 overflow-y-auto">
      <div className="bg-white rounded-md border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#e60049] text-white px-5 py-3.5 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wide">
              Tài khoản Huy Tutor
            </h2>
            <p className="text-[11px] text-white/90 mt-0.5">
              Quản lý tủ sách tài liệu, đơn hàng và phiên đăng nhập
            </p>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="px-2.5 py-1 bg-white text-[#e60049] font-bold text-xs rounded-sm hover:bg-gray-100 transition"
          >
            Đóng
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`py-2.5 text-center transition ${
              authModalTab === 'login'
                ? 'bg-white text-[#e60049] border-b-2 border-[#e60049]'
                : 'text-gray-600 hover:text-[#e60049]'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`py-2.5 text-center transition ${
              authModalTab === 'register'
                ? 'bg-white text-[#e60049] border-b-2 border-[#e60049]'
                : 'text-gray-600 hover:text-[#e60049]'
            }`}
          >
            Đăng ký mới
          </button>
          <button
            type="button"
            onClick={() => switchTab('forgot')}
            className={`py-2.5 text-center transition ${
              authModalTab === 'forgot'
                ? 'bg-white text-[#e60049] border-b-2 border-[#e60049]'
                : 'text-gray-600 hover:text-[#e60049]'
            }`}
          >
            Quên mật khẩu
          </button>
        </div>

        <div className="p-5">
          {errorMsg && (
            <div className="mb-3.5 p-2.5 bg-red-50 border border-[#e60049] text-[#e60049] text-xs font-bold rounded-sm">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-3.5 p-2.5 bg-emerald-50 border border-emerald-600 text-emerald-800 text-xs font-semibold rounded-sm">
              {successMsg}
            </div>
          )}

          {/* TAB 1: ĐĂNG NHẬP */}
          {authModalTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Địa chỉ Gmail *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hoten@gmail.com"
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-2.5 rounded-sm transition"
              >
                {submitting ? 'Đang xác thực...' : 'Đăng nhập'}
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-600">
                <button
                  type="button"
                  onClick={() => switchTab('forgot')}
                  className="text-[#e60049] font-semibold hover:underline"
                >
                  Quên mật khẩu?
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('register')}
                  className="text-gray-700 font-semibold hover:text-[#e60049]"
                >
                  Chưa có tài khoản? Đăng ký ngay
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ĐĂNG KÝ */}
          {authModalTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Cô Nguyễn Thị Mai"
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Địa chỉ Gmail nhận tài liệu *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Số điện thoại / Zalo *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Đối tượng *
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
                    Trường học / Đơn vị
                  </label>
                  <input
                    type="text"
                    value={schoolOrOrg}
                    onChange={(e) => setSchoolOrOrg(e.target.value)}
                    placeholder="THPT Chuyên..."
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Mật khẩu (tối thiểu 6 ký tự) *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Nhập lại mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu"
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-2.5 rounded-sm transition"
              >
                {submitting ? 'Đang khởi tạo tài khoản...' : 'Đăng ký tài khoản'}
              </button>
            </form>
          )}

          {/* TAB 3: QUÊN MẬT KHẨU */}
          {authModalTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-3.5">
              <p className="text-xs text-gray-600 leading-relaxed">
                Nhập địa chỉ Gmail đã đăng ký của bạn. Hệ thống sẽ gửi đường dẫn đặt lại mật khẩu
                mới về hộp thư của bạn.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Địa chỉ Gmail đã đăng ký *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hoten@gmail.com"
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-2.5 rounded-sm transition"
              >
                {submitting ? 'Đang gửi email...' : 'Gửi liên kết đặt lại mật khẩu'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

