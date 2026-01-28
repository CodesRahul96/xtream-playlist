module.exports = {
    // Upstream Provider Credentials
    XTREAM_BASE_URL: 'http://webo.asia:80',
    USERNAME: '12341234',
    PASSWORD: '43214321',

    // Spoofed Device Headers (TiviMate Latest)
    SPOOF_HEADERS: {
        'User-Agent': 'TiviMate/5.1.0 (Linux; Android 11; TV)',
        'X-Requested-With': 'ar.tvplayer.tv',
        'Accept': '*/*',
        'Connection': 'keep-alive'
    },

    // Performance Settings
    STREAM_TIMEOUT: 30000,
    PLAYLIST_TIMEOUT: 15000
};
