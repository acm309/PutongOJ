-- Session management Lua script for Redis

-- Sorted set containing user's session IDs
-- The score is the last access timestamp
local function list_key(user_id)
  return 'session:' .. user_id .. ':list'
end

-- JSON serialized session info
local function info_key(user_id, session_id)
  return 'session:' .. user_id .. ':info:' .. session_id
end

-- Create a new session, enforcing max_sessions limit
-- max_age is in seconds; timestamp is in milliseconds
local function create(user_id, session_id, info_json, timestamp, max_sessions, max_age)
  timestamp = tonumber(timestamp)
  max_sessions = tonumber(max_sessions)
  max_age = tonumber(max_age)

  local lk = list_key(user_id)
  local ik = info_key(user_id, session_id)

  -- Lazily purge members whose info key has already expired (score too old)
  local expired_before = timestamp - max_age * 1000
  local expired = redis.call('ZRANGEBYSCORE', lk, '-inf', expired_before)
  for _, old_id in ipairs(expired) do
    redis.call('DEL', info_key(user_id, old_id))
  end
  if #expired > 0 then
    redis.call('ZREMRANGEBYSCORE', lk, '-inf', expired_before)
  end

  redis.call('SET', ik, info_json, 'EX', max_age)
  redis.call('ZADD', lk, timestamp, session_id)
  redis.call('EXPIRE', lk, max_age)

  -- Remove oldest sessions if count still exceeds max_sessions
  local count = redis.call('ZCARD', lk)
  if count > max_sessions then
    local excess = redis.call('ZRANGE', lk, 0, count - max_sessions - 1)
    for _, old_id in ipairs(excess) do
      redis.call('DEL', info_key(user_id, old_id))
    end
    redis.call('ZREMRANGEBYRANK', lk, 0, count - max_sessions - 1)
  end

  return 1
end

-- Access a session: validate, update timestamp, and slide TTL
-- max_age is in seconds; timestamp is in milliseconds
local function access(user_id, session_id, timestamp, max_age)
  timestamp = tonumber(timestamp)
  max_age = tonumber(max_age)

  local lk = list_key(user_id)
  local ik = info_key(user_id, session_id)

  local info = redis.call('GET', ik)
  if not info then
    redis.call('ZREM', lk, session_id)
    return nil
  end

  -- Slide TTL on the info key and refresh the score
  redis.call('EXPIRE', ik, max_age)
  redis.call('ZADD', lk, timestamp, session_id)
  redis.call('EXPIRE', lk, max_age)

  return info
end

-- Revoke a specific session
local function revoke(user_id, session_id)
  redis.call('ZREM', list_key(user_id), session_id)
  redis.call('DEL', info_key(user_id, session_id))

  return 1
end

-- Revoke all sessions except the specified one
local function revoke_others(user_id, keep_session_id)
  local lk = list_key(user_id)
  local members = redis.call('ZRANGE', lk, 0, -1)
  local removed = 0

  for _, sid in ipairs(members) do
    if sid ~= keep_session_id then
      redis.call('DEL', info_key(user_id, sid))
      redis.call('ZREM', lk, sid)
      removed = removed + 1
    end
  end

  return removed
end

-- List all active sessions with their timestamps and info
local function list(user_id)
  local lk = list_key(user_id)
  local members = redis.call('ZRANGE', lk, 0, -1, 'WITHSCORES')
  local result = {}

  for i = 1, #members, 2 do
    local sid = members[i]
    local score = members[i + 1]
    local info = redis.call('GET', info_key(user_id, sid))

    if info then
      result[#result + 1] = sid
      result[#result + 1] = score
      result[#result + 1] = info
    else
      redis.call('ZREM', lk, sid)
    end
  end

  return result
end

-- Dispatch method calls
local method = ARGV[1]
if method == 'create' then
  return create(ARGV[2], ARGV[3], ARGV[4], ARGV[5], ARGV[6], ARGV[7])
elseif method == 'access' then
  return access(ARGV[2], ARGV[3], ARGV[4], ARGV[5])
elseif method == 'revoke' then
  return revoke(ARGV[2], ARGV[3])
elseif method == 'revoke_others' then
  return revoke_others(ARGV[2], ARGV[3])
elseif method == 'list' then
  return list(ARGV[2])
else
  return redis.error_reply('unknown method: ' .. tostring(method))
end
