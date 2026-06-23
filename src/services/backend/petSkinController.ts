// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** exchangePetSkin POST /api/api/pet/skin/exchange */
export async function exchangePetSkinUsingPost(
  body: API.PetSkinExchangeRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/api/pet/skin/exchange', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** listPetSkins GET /api/api/pet/skin/list */
export async function listPetSkinsUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listPetSkinsUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePagePetSkinVO_>('/api/api/pet/skin/list', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** setPetSkin POST /api/api/pet/skin/set */
export async function setPetSkinUsingPost(
  body: API.PetSkinSetRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePetVO_>('/api/api/pet/skin/set', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
