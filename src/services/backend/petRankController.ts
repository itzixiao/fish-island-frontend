// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** getPetRankList GET /api/api/pet/rank/list */
export async function getPetRankListUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPetRankListUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListPetRankVO_>('/api/api/pet/rank/list', {
    method: 'GET',
    params: {
      // limit has a default value: 10
      limit: '10',
      ...params,
    },
    ...(options || {}),
  });
}
