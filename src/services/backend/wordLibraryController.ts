// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 创建词库项（仅管理员） POST /api/word/library/add */
export async function addWordLibraryUsingPost(
  body: API.WordLibraryAddRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLong_>('/api/word/library/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除词库项（仅管理员） POST /api/word/library/delete */
export async function deleteWordLibraryUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/word/library/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 根据 ID 获取词库项（仅管理员） GET /api/word/library/get */
export async function getWordLibraryByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getWordLibraryByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseWordLibrary_>('/api/word/library/get', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 分页获取词库列表（仅管理员） POST /api/word/library/list/page */
export async function listWordLibraryByPageUsingPost(
  body: API.WordLibraryQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageWordLibrary_>('/api/word/library/list/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新词库项（仅管理员） POST /api/word/library/update */
export async function updateWordLibraryUsingPost(
  body: API.WordLibraryUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/word/library/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
