SUBSCRIPTION_LIMITS = {
    "FREE": {
        "characters_translated": 100000,
        "audio_seconds": 3000,
        "video_seconds": 1800,
        "documents_processed": 50,
        "ai_requests": 200,
        "storage_bytes": 500 * 1024 * 1024 # 500 MB
    },
    "PRO": {
        "characters_translated": 1000000,
        "audio_seconds": 7200, # 120 mins
        "video_seconds": 3600, # 60 mins
        "documents_processed": 100,
        "ai_requests": 500,
        "storage_bytes": 5 * 1024 * 1024 * 1024 # 5 GB
    },
    "BUSINESS": {
        "characters_translated": 10000000,
        "audio_seconds": 36000, # 600 mins
        "video_seconds": 18000, # 300 mins
        "documents_processed": 1000,
        "ai_requests": 5000,
        "storage_bytes": 50 * 1024 * 1024 * 1024 # 50 GB
    }
}
