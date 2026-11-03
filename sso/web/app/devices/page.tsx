'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Monitor, ShieldAlert, LogOut, CheckCircle2, Loader2, Info, Store, BookOpen, Trash2 } from 'lucide-react';

export default function DevicesPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [flashcardDevices, setFlashcardDevices] = useState<any[]>([]);
  const [maxDevices, setMaxDevices] = useState<number>(3);
  const [actionLoading, setActionLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/sessions');
      if (res.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent('/devices')}`;
        return;
      }
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
        setFlashcardDevices(data.flashcardDevices || []);
        setMaxDevices(data.maxDevices || 3);
      } else {
        const errorText = data.error?.message || (typeof data.error === 'string' ? data.error : 'Vui lòng đăng nhập để xem thông tin thiết bị.');
        setMsg({ type: 'error', text: errorText });
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

  async function handleRevokeAll(appFilter?: 'shop' | 'flashcard') {
    const promptMsg = appFilter === 'shop'
      ? 'Bạn có chắc chắn muốn đăng xuất khỏi tất cả phiên của Shop?'
      : appFilter === 'flashcard'
      ? 'Bạn có chắc chắn muốn đăng xuất khỏi tất cả phiên Flashcard?'
      : 'Bạn có chắc chắn muốn đăng xuất khỏi tất cả thiết bị trên toàn hệ thống?';

    if (!confirm(promptMsg)) return;

    setActionLoading(true);
    try {
      const url = appFilter ? `/api/auth/sessions?app=${appFilter}` : '/api/auth/sessions';
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMsg({
          type: 'success',
          text: data.message || 'Đã thu hồi các phiên thành công!',
        });
        await loadData();
      } else {
        const errorText = data.error?.message || (typeof data.error === 'string' ? data.error : 'Lỗi khi đăng xuất các thiết bị.');
        setMsg({ type: 'error', text: errorText });
      }
    } catch {
      setMsg({ type: 'error', text: 'Lỗi mạng khi thực hiện thao tác.' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevokeSingle(sessionId: string) {
    if (!confirm('Bạn có chắc muốn thu hồi phiên đăng nhập này?')) return;
    setRevokingId(sessionId);
    try {
      const res = await fetch(`/api/auth/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: 'Đã thu hồi phiên đăng nhập thành công.' });
        await loadData();
      } else {
        const errorText = data.error?.message || (typeof data.error === 'string' ? data.error : 'Không thể thu hồi phiên.');
        setMsg({ type: 'error', text: errorText });
      }
    } catch {
      setMsg({ type: 'error', text: 'Lỗi mạng khi thu hồi phiên.' });
    } finally {
      setRevokingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand mb-2" />
        <p className="text-xs text-gray-500">Đang tải danh sách thiết bị...</p>
      </div>
    );
  }

  const shopSessions = sessions.filter((s) => s.app_source !== 'flashcard');
  const flashcardSessions = sessions.filter((s) => s.app_source === 'flashcard');

  return (
    <div className="w-full max-w-3xl bg-white rounded-sm border border-gray-200 shadow-xs p-6 sm:p-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              Quản lý Thiết bị &amp; Phiên
            </h1>
            <span className="text-[10px] bg-brand text-white font-bold px-1.5 py-0.5 rounded-xs uppercase tracking-wide">
              SSO
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Trung tâm quản lý phiên đăng nhập và bảo mật thiết bị trên toàn hệ sinh thái Huy Tutor.
          </p>
        </div>
        <button
          onClick={() => handleRevokeAll()}
          disabled={actionLoading}
          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xs text-xs font-bold transition flex items-center gap-1.5 border border-red-200 disabled:opacity-50"
        >
          {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          <span>Đăng xuất tất cả phiên</span>
        </button>
      </div>

      {msg && (
        <div className={`mb-6 p-3 rounded-xs text-xs flex items-center gap-2 ${
          msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <ShieldAlert className="w-4 h-4 flex-shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* SECTION 1: PHÂN HỆ FLASHCARD */}
      <div className="mb-6 p-5 bg-white rounded-sm border border-gray-200 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand text-white rounded-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">1. Phân hệ Flashcard Học tập</h2>
              <p className="text-[11px] text-gray-500">Giới hạn phần cứng cố định chống chia sẻ tài khoản trái phép</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-xs text-xs font-bold bg-brand text-white">
              Hạn mức: {flashcardDevices.length} / {maxDevices === Infinity ? 'Không giới hạn' : `${maxDevices} máy`}
            </span>
            {flashcardSessions.length > 0 && (
              <button
                onClick={() => handleRevokeAll('flashcard')}
                disabled={actionLoading}
                className="px-2.5 py-1 bg-white hover:bg-gray-50 text-brand text-[11px] font-bold rounded-xs border border-gray-300 transition"
              >
                Đăng xuất Flashcard
              </button>
            )}
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xs mb-4 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Học viên được liên kết tối đa <strong>{maxDevices} thiết bị</strong> học Flashcard. Khi bạn đăng xuất phiên, thông số thiết bị vẫn được bảo lưu để giữ nguyên hạn mức phần cứng.
          </p>
        </div>

        {/* Danh sách thiết bị phần cứng liên kết */}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Thiết bị phần cứng đã liên kết</h3>
          <div className="space-y-2">
            {flashcardDevices.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-3 text-center bg-gray-50 rounded-xs border border-dashed border-gray-200">
                Chưa có thiết bị nào kích hoạt học Flashcard.
              </p>
            ) : (
              flashcardDevices.map((dev) => (
                <div key={dev.id} className="p-2.5 bg-gray-50 rounded-xs border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-white rounded-xs text-brand border border-gray-200">
                      {dev.device_name?.includes('Phone') || dev.device_name?.includes('Android') ? (
                        <Smartphone className="w-4 h-4" />
                      ) : (
                        <Monitor className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{dev.device_name || 'Thiết bị Web'}</p>
                      <p className="text-[10px] text-gray-500">
                        Hoạt động lần cuối: {new Date(dev.last_seen).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-green-800 bg-green-50 px-2 py-0.5 rounded-xs border border-green-200">
                    Đã bảo lưu Quota
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Danh sách phiên Flashcard đang mở */}
        <div>
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Phiên Flashcard đang mở ({flashcardSessions.length})</h3>
          <div className="space-y-2">
            {flashcardSessions.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-3 text-center bg-gray-50 rounded-xs border border-dashed border-gray-200">
                Không có phiên Flashcard nào đang mở.
              </p>
            ) : (
              flashcardSessions.map((sess) => (
                <div key={sess.id} className="p-2.5 bg-white rounded-xs border border-gray-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-800 truncate">{sess.device_name || 'Trình duyệt'}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-gray-100 text-gray-600 border border-gray-200">IP: {sess.ip_address || 'Ẩn'}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{sess.user_agent}</p>
                  </div>
                  <button
                    onClick={() => handleRevokeSingle(sess.id)}
                    disabled={revokingId === sess.id}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xs border border-transparent hover:border-red-200 transition"
                    title="Thu hồi phiên này"
                  >
                    {revokingId === sess.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: PHÂN HỆ HUY TUTOR SHOP */}
      <div className="p-5 bg-white rounded-sm border border-gray-200 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-800 text-white rounded-xs">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">2. Phân hệ Tài liệu Shop</h2>
              <p className="text-[11px] text-gray-500">Không giới hạn thiết bị • Cho phép đăng nhập tự do mua tài liệu</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-xs text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
              Không giới hạn thiết bị
            </span>
            {shopSessions.length > 0 && (
              <button
                onClick={() => handleRevokeAll('shop')}
                disabled={actionLoading}
                className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 text-[11px] font-bold rounded-xs border border-gray-300 transition"
              >
                Đăng xuất Shop
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {shopSessions.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-3 text-center bg-gray-50 rounded-xs border border-dashed border-gray-200">
              Không có phiên Shop nào đang mở.
            </p>
          ) : (
            shopSessions.map((sess) => (
              <div key={sess.id} className="p-2.5 bg-white rounded-xs border border-gray-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-800 truncate">{sess.device_name || 'Trình duyệt Shop'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-gray-100 text-gray-600 border border-gray-200">IP: {sess.ip_address || 'Ẩn'}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{sess.user_agent}</p>
                </div>
                <button
                  onClick={() => handleRevokeSingle(sess.id)}
                  disabled={revokingId === sess.id}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xs border border-transparent hover:border-red-200 transition"
                  title="Thu hồi phiên này"
                >
                  {revokingId === sess.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
