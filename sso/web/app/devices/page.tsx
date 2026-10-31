'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Monitor, ShieldAlert, LogOut, CheckCircle2, Loader2, Info } from 'lucide-react';

export default function DevicesPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [flashcardDevices, setFlashcardDevices] = useState<any[]>([]);
  const [maxDevices, setMaxDevices] = useState<number>(3);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/sessions');
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
        setFlashcardDevices(data.flashcardDevices || []);
        setMaxDevices(data.maxDevices || 3);
      } else {
        setMsg({ type: 'error', text: data.error || 'Vui lòng đăng nhập để xem thông tin thiết bị.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Không thể kết nối máy chủ.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleRevokeAll() {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất khỏi tất cả thiết bị? Toàn bộ các phiên đăng nhập khác sẽ bị vô hiệu hóa.')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/auth/sessions', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMsg({
          type: 'success',
          text: 'Đã đăng xuất toàn bộ phiên thành công! Lưu ý: Danh sách thiết bị học Flashcard vẫn được bảo lưu quota.'
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setMsg({ type: 'error', text: data.error || 'Lỗi khi đăng xuất các thiết bị.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Lỗi mạng khi thực hiện thao tác.' });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand mb-2" />
        <p className="text-xs text-muted-foreground">Đang tải danh sách thiết bị...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border-2 border-[#f0e0e7] p-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-[#1a1a2e] tracking-tight">Quản lý Thiết bị & Phiên</h1>
          <p className="text-muted-foreground text-xs mt-1">
            Theo dõi các phiên đang đăng nhập trên toàn hệ thống Huy Tutor.
          </p>
        </div>
        <button
          onClick={handleRevokeAll}
          disabled={actionLoading}
          className="px-3.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-red-200 disabled:opacity-50"
        >
          {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          <span>Đăng xuất tất cả phiên</span>
        </button>
      </div>

      {msg && (
        <div className={`mb-6 p-4 rounded-xl text-xs flex items-center gap-2 ${
          msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <ShieldAlert className="w-4 h-4 flex-shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* SECTION 1: FLASHCARD BOUND DEVICES (LIMITED) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900">Thiết bị học Flashcard</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-light text-brand">
              {flashcardDevices.length} / {maxDevices === Infinity ? 'Không giới hạn' : maxDevices} máy
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Áp dụng cho ứng dụng Flashcard</span>
        </div>

        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl mb-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Học viên được liên kết tối đa <strong>{maxDevices} thiết bị</strong> học Flashcard. Khi bạn đăng xuất phiên, thông số thiết bị vẫn được bảo lưu. Để gỡ thiết bị cũ đổi máy mới, vui lòng liên hệ Admin.
          </p>
        </div>

        <div className="space-y-2">
          {flashcardDevices.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3 text-center bg-gray-50 rounded-xl">
              Chưa có thiết bị nào kích hoạt học Flashcard.
            </p>
          ) : (
            flashcardDevices.map((dev) => (
              <div key={dev.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-200 text-brand">
                    {dev.device_name?.includes('Phone') || dev.device_name?.includes('Android') ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Monitor className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{dev.device_name || 'Thiết bị Web'}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Hoạt động lần cuối: {new Date(dev.last_seen).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                  Đã liên kết
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 2: ACTIVE SESSIONS (SHOP + FLASHCARD) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">Các phiên đăng nhập đang hoạt động</h2>
          <span className="text-xs text-muted-foreground">Shop không giới hạn số phiên</span>
        </div>

        <div className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3 text-center bg-gray-50 rounded-xl">
              Không có phiên hoạt động nào.
            </p>
          ) : (
            sessions.map((sess) => (
              <div key={sess.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800">
                      {sess.app_source === 'flashcard' ? 'Flashcard Học tập' : 'Huy Tutor Shop'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-medium">
                      IP: {sess.ip_address || 'Ẩn'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-sm">
                    {sess.user_agent || 'Trình duyệt Web'}
                  </p>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Hết hạn: {new Date(sess.expires_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

