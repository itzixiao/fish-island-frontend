// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 添加评论 POST /api/comment/add */
export async function addCommentUsingPost(
  body: API.CommentAddRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLong_>('/api/comment/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除评论 POST /api/comment/delete */
export async function deletePostUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/comment/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取二级评论（分页） POST /api/comment/list/children */
export async function getChildCommentsUsingPost(
  body: API.ChildCommentQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageCommentVO_>('/api/comment/list/children', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取评论树（分页） POST /api/comment/list/tree */
export async function getCommentTreeUsingPost(
  body: API.CommentQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageCommentNodeVO_>('/api/comment/list/tree', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
