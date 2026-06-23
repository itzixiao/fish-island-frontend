// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 分页获取道具列表 GET /api/props/list/page */
export async function listPropsPageUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listPropsPageUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePagePropsVO_>('/api/props/list/page', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 购买道具 POST /api/props/purchase */
export async function purchasePropsUsingPost(
  body: API.PropsPurchaseRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/props/purchase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
