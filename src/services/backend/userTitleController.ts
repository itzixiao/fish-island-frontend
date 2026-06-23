// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 创建称号项（仅管理员） POST /api/user/title/add */
export async function addUserTitleUsingPost(
  body: API.UserTitleAddRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLong_>('/api/user/title/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 给用户添加称号（仅管理员） POST /api/user/title/add/toUser */
export async function addTitleToUserUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.addTitleToUserUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/user/title/add/toUser', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 删除称号项（仅管理员） POST /api/user/title/delete */
export async function deleteUserTitleUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/user/title/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 根据 ID 获取称号项（仅管理员） GET /api/user/title/get */
export async function getUserTitleByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUserTitleByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseUserTitle_>('/api/user/title/get', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取用户可用的称号列表 GET /api/user/title/list */
export async function listAvailableFramesUsingGet1(options?: { [key: string]: any }) {
  return request<API.BaseResponseListUserTitle_>('/api/user/title/list', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 根据用户ID查看用户拥有的称号列表（仅管理员） GET /api/user/title/list/byUserId */
export async function listUserTitlesByUserIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listUserTitlesByUserIdUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListUserTitle_>('/api/user/title/list/byUserId', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 分页获取称号列表（仅管理员） POST /api/user/title/list/page */
export async function listUserTitleByPageUsingPost(
  body: API.UserTitleQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageUserTitle_>('/api/user/title/list/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除用户称号（仅管理员） POST /api/user/title/remove/fromUser */
export async function removeTitleFromUserUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.removeTitleFromUserUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/user/title/remove/fromUser', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 设置当前使用的称号 POST /api/user/title/set */
export async function setCurrentFrameUsingPost1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.setCurrentFrameUsingPOST1Params,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/user/title/set', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 更新称号项（仅管理员） POST /api/user/title/update */
export async function updateUserTitleUsingPost(
  body: API.UserTitleUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/user/title/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
