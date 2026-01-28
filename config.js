module.exports = {
    // Upstream Provider Credentials
    XTREAM_BASE_URL: 'http://starshare.st:80',
    USERNAME: '758811',
    PASSWORD: '854100',

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
