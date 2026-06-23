// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 创建标签（仅管理员可用） POST /api/tags/add */
export async function addTagsUsingPost(body: API.TagsAddRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseLong_>('/api/tags/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除标签（仅管理员可用） POST /api/tags/delete */
export async function deleteTagsUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/tags/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 根据 id 获取标签（封装类） GET /api/tags/get/vo */
export async function getTagsVoByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTagsVOByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseTagsVO_>('/api/tags/get/vo', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 分页获取标签列表（仅管理员可用） POST /api/tags/list/page */
export async function listTagsByPageUsingPost(
  body: API.TagsQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageTags_>('/api/tags/list/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 分页获取标签列表（封装类） POST /api/tags/list/page/vo */
export async function listTagsVoByPageUsingPost(
  body: API.TagsQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageTagsVO_>('/api/tags/list/page/vo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新标签（仅管理员可用） POST /api/tags/update */
export async function updateTagsUsingPost(
  body: API.TagsUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/tags/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
