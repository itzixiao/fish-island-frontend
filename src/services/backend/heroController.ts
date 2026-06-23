// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** addHeroList POST /api/hero/add */
export async function addHeroListUsingPost(options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean_>('/api/hero/add', {
    method: 'POST',
    ...(options || {}),
  });
}

/** getHeroById GET /api/hero/get */
export async function getHeroByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getHeroByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseHeroVO_>('/api/hero/get', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** getNewHero GET /api/hero/get/new */
export async function getNewHeroUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseHeroVO_>('/api/hero/get/new', {
    method: 'GET',
    ...(options || {}),
  });
}

/** getRandomHero GET /api/hero/get/random */
export async function getRandomHeroUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseString_>('/api/hero/get/random', {
    method: 'GET',
    ...(options || {}),
  });
}

/** getGuessCount GET /api/hero/guess/count */
export async function getGuessCountUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseInt_>('/api/hero/guess/count', {
    method: 'GET',
    ...(options || {}),
  });
}

/** getGuessRanking GET /api/hero/guess/ranking */
export async function getGuessRankingUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseListHeroRankingVO_>('/api/hero/guess/ranking', {
    method: 'GET',
    ...(options || {}),
  });
}

/** recordGuessSuccess POST /api/hero/guess/success */
export async function recordGuessSuccessUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.recordGuessSuccessUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/hero/guess/success', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** getCurrentUserGuessData GET /api/hero/guess/user */
export async function getCurrentUserGuessDataUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseHeroRankingVO_>('/api/hero/guess/user', {
    method: 'GET',
    ...(options || {}),
  });
}

/** listSimpleHero GET /api/hero/list/simple */
export async function listSimpleHeroUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseListSimpleHeroVO_>('/api/hero/list/simple', {
    method: 'GET',
    ...(options || {}),
  });
}
