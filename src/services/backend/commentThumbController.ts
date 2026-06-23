// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 评论点赞/取消点赞 POST /api/comment_thumb/ */
export async function doThumbUsingPost(
  body: API.CommentThumbAddRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseInt_>('/api/comment_thumb/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
