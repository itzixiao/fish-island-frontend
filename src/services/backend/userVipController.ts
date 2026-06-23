// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 创建会员（仅管理员） POST /api/user/vip/add */
export async function addUserVipUsingPost(
  body: API.UserVipAddRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLong_>('/api/user/vip/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 检查当前用户是否是会员 GET /api/user/vip/check */
export async function checkUserVipUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean_>('/api/user/vip/check', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 检查当前用户是否是永久会员 GET /api/user/vip/check/permanent */
export async function checkPermanentVipUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean_>('/api/user/vip/check/permanent', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 删除会员（仅管理员） POST /api/user/vip/delete */
export async function deleteUserVipUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/user/vip/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取当前登录用户的会员信息 GET /api/user/vip/get/my */
export async function getCurrentUserVipUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseUserVipVO_>('/api/user/vip/get/my', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 根据id获取会员信息 GET /api/user/vip/get/vo */
export async function getUserVipVoByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUserVipVOByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseUserVipVO_>('/api/user/vip/get/vo', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 分页获取会员列表（仅管理员） POST /api/user/vip/list/page */
export async function listUserVipByPageUsingPost(
  body: API.UserVipQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageUserVip_>('/api/user/vip/list/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 分页获取会员列表（封装类）（仅管理员） POST /api/user/vip/list/page/vo */
export async function listUserVipVoByPageUsingPost(
  body: API.UserVipQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageUserVipVO_>('/api/user/vip/list/page/vo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新会员（仅管理员） POST /api/user/vip/update */
export async function updateUserVipUsingPost(
  body: API.UserVipUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/user/vip/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
