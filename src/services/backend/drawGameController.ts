// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** saveDrawData POST /api/draw/data/save */
export async function saveDrawDataUsingPost(
  body: API.DrawDataSaveRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/draw/data/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** endGame POST /api/draw/game/end */
export async function endGameUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.endGameUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/draw/game/end', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** nextRound POST /api/draw/game/next-round */
export async function nextRoundUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.nextRoundUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/draw/game/next-round', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** startGame POST /api/draw/game/start */
export async function startGameUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.startGameUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/draw/game/start', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** guessWord POST /api/draw/guess */
export async function guessWordUsingPost(
  body: API.DrawGuessRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseDrawGuessVO_>('/api/draw/guess', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** getRoomById GET /api/draw/room/${param0} */
export async function getRoomByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getRoomByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  const { roomId: param0, ...queryParams } = params;
  return request<API.BaseResponseDrawRoomVO_>(`/api/draw/room/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** getRoomGuesses GET /api/draw/room/${param0}/guesses */
export async function getRoomGuessesUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getRoomGuessesUsingGETParams,
  options?: { [key: string]: any },
) {
  const { roomId: param0, ...queryParams } = params;
  return request<API.BaseResponseListDrawGuessVO_>(`/api/draw/room/${param0}/guesses`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** createRoom POST /api/draw/room/create */
export async function createRoomUsingPost(
  body: API.DrawRoomCreateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseString_>('/api/draw/room/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** joinRoom POST /api/draw/room/join */
export async function joinRoomUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.joinRoomUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/draw/room/join', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** getAllRooms GET /api/draw/room/list */
export async function getAllRoomsUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseListDrawRoomVO_>('/api/draw/room/list', {
    method: 'GET',
    ...(options || {}),
  });
}

/** quitRoom POST /api/draw/room/quit */
export async function quitRoomUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.quitRoomUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/draw/room/quit', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** removeRoom POST /api/draw/room/remove */
export async function removeRoomUsingPost(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.removeRoomUsingPOSTParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/draw/room/remove', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
