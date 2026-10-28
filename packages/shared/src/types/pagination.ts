export interface PaginationMeta {
  page: number;         // Trang hiện tại (1-based)
  limit: number;        // Số bản ghi mỗi trang (10, 20, 30, 50, 100)
  totalItems: number;   // Tổng số bản ghi thực tế trong DB
  totalPages: number;   // Tổng số trang tính toán
  hasNextPage: boolean; // Có trang kế tiếp hay không
  hasPrevPage: boolean; // Có trang trước đó hay không
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}
