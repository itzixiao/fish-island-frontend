// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 创建宠物 POST /api/pet/create */
export async function createPetUsingPost(
  body: API.CreatePetRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLong_>('/api/pet/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 喂食宠物 消耗5积分，增加宠物饥饿度和心情值，有1小时冷却时间 POST /api/pet/feed */
export async function feedPetUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.feedPetUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePetVO_>('/api/pet/feed', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取宠物详情 GET /api/pet/my/get */
export async function getPetDetailUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponsePetVO_>('/api/pet/my/get', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 查看其他用户的宠物 GET /api/pet/other */
export async function getOtherUserPetUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getOtherUserPetUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseOtherUserPetVO_>('/api/pet/other', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 抚摸宠物 消耗3积分，增加宠物心情值，有1小时冷却时间 POST /api/pet/pat */
export async function patPetUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.patPetUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePetVO_>('/api/pet/pat', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 修改宠物名称 POST /api/pet/update/name */
export async function updatePetNameUsingPost(
  body: API.UpdatePetNameRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/pet/update/name', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
