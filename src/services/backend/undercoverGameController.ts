// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取当前登录用户信息 GET /api/undercover/player/current */
export async function getCurrentPlayerInfoUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getCurrentPlayerInfoUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseUndercoverPlayerVO_>('/api/undercover/player/current', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取玩家详细信息 GET /api/undercover/player/detail */
export async function getPlayerDetailInfoUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPlayerDetailInfoUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseUndercoverPlayerDetailVO_>('/api/undercover/player/detail', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 淘汰玩家 POST /api/undercover/player/eliminate */
export async function eliminatePlayerUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.eliminatePlayerUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/undercover/player/eliminate', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取玩家信息 GET /api/undercover/player/info */
export async function getPlayerInfoUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPlayerInfoUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseUndercoverPlayerVO_>('/api/undercover/player/info', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 根据房间ID获取房间信息 GET /api/undercover/room/byId */
export async function getRoomByIdUsingGet1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getRoomByIdUsingGET1Params,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseUndercoverRoomVO_>('/api/undercover/room/byId', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 创建游戏房间 POST /api/undercover/room/create */
export async function createRoomUsingPost1(
  body: API.UndercoverRoomCreateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseString_>('/api/undercover/room/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 结束游戏 POST /api/undercover/room/end */
export async function endGameUsingPost1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.endGameUsingPOST1Params,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/undercover/room/end', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 卧底猜平民词 POST /api/undercover/room/guess */
export async function guessWordUsingPost1(
  body: API.UndercoverGuessRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/undercover/room/guess', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 加入游戏房间 POST /api/undercover/room/join */
export async function joinRoomUsingPost1(
  body: API.UndercoverRoomJoinRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/undercover/room/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取所有房间列表 GET /api/undercover/room/list */
export async function getAllRoomsUsingGet1(options?: { [key: string]: any }) {
  return request<API.BaseResponseListUndercoverRoomVO_>('/api/undercover/room/list', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取房间内所有玩家详细信息 GET /api/undercover/room/players-detail */
export async function getRoomPlayersDetailUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getRoomPlayersDetailUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListUndercoverPlayerDetailVO_>(
    '/api/undercover/room/players-detail',
    {
      method: 'GET',
      params: {
        ...params,
      },
      ...(options || {}),
    },
  );
}

/** 退出游戏房间 POST /api/undercover/room/quit */
export async function quitRoomUsingPost1(
  body: API.UndercoverRoomQuitRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/undercover/room/quit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 移除当前活跃房间（仅管理员） POST /api/undercover/room/remove */
export async function removeActiveRoomUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.removeActiveRoomUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/undercover/room/remove', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 开始游戏 POST /api/undercover/room/start */
export async function startGameUsingPost1(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.startGameUsingPOST1Params,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/undercover/room/start', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 提交投票 POST /api/undercover/room/vote */
export async function voteUsingPost(
  body: API.UndercoverVoteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/undercover/room/vote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取投票结果 GET /api/undercover/room/votes */
export async function getRoomVotesUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getRoomVotesUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListUndercoverVoteVO_>('/api/undercover/room/votes', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
