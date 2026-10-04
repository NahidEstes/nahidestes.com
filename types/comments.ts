export type CommentPostType = "post" | "place";
export type CommentStatus = "pending" | "approved" | "spam" | "trashed";
export type CommentModerationAction = "approve" | "pending" | "spam" | "trash" | "restore";

export interface PublicComment {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

export interface AdminCommentRow extends PublicComment {
  email: string;
  status: CommentStatus;
  postId: string;
  postType: CommentPostType;
  articleTitle: string;
  articleSlug: string;
  articlePath: string;
  updatedAt: string;
}

export interface CommentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CommentStatusCounts {
  all: number;
  pending: number;
  approved: number;
  spam: number;
  trash: number;
}
