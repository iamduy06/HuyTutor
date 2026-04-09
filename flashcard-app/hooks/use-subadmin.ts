"use client";

import { useUser } from "@/components/common/UserContext";

/**
 * Hook chuyên dụng để kiểm tra trạng thái SubAdmin
 * Kết hợp cả System Role và Group Membership
 */
export function useSubadmin() {
  const { user, loading } = useUser();

  // 1. Kiểm tra xem có phải là SubAdmin hệ thống không (role)
  const isSystemSubadmin = user?.role === "SUBADMIN";
  
  // 2. Kiểm tra xem có quyền Admin hệ thống không (Admin có quyền subadmin mọi group)
  const isSystemAdmin = user?.role === "ADMIN";

  // 3. Kiểm tra xem có đang hoạt động trong ít nhất 1 group không
  // is_subadmin được fetch từ bảng group_users trong UserContext
  const isGroupActive = !!user?.is_subadmin;

  // Quyền truy cập Subadmin Panel
  const canAccessPanel = isSystemAdmin || (isSystemSubadmin && isGroupActive);

  // Trạng thái chờ gán group (là subadmin nhưng chưa có group)
  const isPendingGroup = isSystemSubadmin && !isGroupActive;

  return {
    user,
    loading,
    isSystemSubadmin,
    isSystemAdmin,
    isGroupActive,
    canAccessPanel,
    isPendingGroup,
    // Trạng thái hiển thị chữ
    effectiveRoleLabel: isSystemAdmin 
      ? "Admin hệ thống" 
      : isSystemSubadmin 
        ? (isGroupActive ? "Subadmin (Đang hoạt động)" : "Subadmin (Chưa gán nhóm)")
        : "Người dùng (User)"
  };
}
