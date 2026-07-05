package org.nep.feedback.config;

import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.connection.*;

/**
 * 本地开发用内存模拟 RedisConnectionFactory（无需安装 Redis）.
 */
public class MockRedisConnectionFactory implements RedisConnectionFactory {

    @Override
    public RedisConnection getConnection() {
        throw new UnsupportedOperationException("Redis not available in dev mode");
    }

    @Override
    public RedisClusterConnection getClusterConnection() {
        throw new UnsupportedOperationException("Redis cluster not available");
    }

    @Override
    public boolean getConvertPipelineAndTxResults() {
        return false;
    }

    @Override
    public RedisSentinelConnection getSentinelConnection() {
        throw new UnsupportedOperationException("Redis sentinel not available");
    }

    @Override
    public DataAccessException translateExceptionIfPossible(RuntimeException ex) {
        return null;
    }
}
