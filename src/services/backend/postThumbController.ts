// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 点赞 / 取消点赞 POST /api/post_thumb/do */
export async function doThumbUsingPost1(
  body: API.PostThumbAddRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseInt_>('/api/post_thumb/do', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
