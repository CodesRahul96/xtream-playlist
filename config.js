module.exports = {
    // Upstream Provider Credentials
    XTREAM_BASE_URL: 'http://vipkendrake.top:8080',
    USERNAME: 'VIP014471744365754384',
    PASSWORD: 'afd9826fe4e2',

    // Spoofed Device Headers (Multiple Profiles for Rotation)
    DEVICE_PROFILES: [
        {
            'User-Agent': 'TiviMate/5.1.0 (Linux; Android 11; TV)',
            'X-Requested-With': 'ar.tvplayer.tv'
        },
        {
            'User-Agent': 'IPTV Smarters/1.0 (Linux; Android 9; SM-G960F)',
            'X-Requested-With': 'com.nst.iptvsmarterstvbox'
        },
        {
            'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
            'X-User-Agent': 'Model: MAG250; Link: WiFi'
        },
        {
            'User-Agent': 'VLC/3.0.16 LibVLC/3.0.16',
            'X-Requested-With': 'org.videolan.vlc'
        },
        {
            'User-Agent': 'Kodi/19.4 (Linux; Android 10; Mi Box)',
            'X-Requested-With': 'org.xbmc.kodi'
        },
        {
            'User-Agent': 'Perfect Player/1.5.8 (Linux; Android 11; SHIELD Android TV)',
            'X-Requested-With': 'com.niklabs.pp'
        },
        {
            'User-Agent': 'GSE SMART IPTV/7.5 (iOS; iPhone13,2; Scale/3.00)',
            'X-Requested-With': 'com.gsetech.smartiptv'
        },
        {
            'User-Agent': 'OTT Navigator/1.6.8.1 (Linux; Android 9; SM-G973F)',
            'X-Requested-With': 'studio.scillarium.ottnavigator'
        }
    ],

    // Helper to get random headers
    getRandomHeaders: function () {
        // Default fallbacks
        const baseHeaders = {
            'Accept': '*/*',
            'Connection': 'keep-alive',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'en-US,en;q=0.9'
        };

        const profiles = this.DEVICE_PROFILES || [];
        const profile = profiles[Math.floor(Math.random() * profiles.length)];

        return { ...baseHeaders, ...profile };
    },

    // Legacy Header (Fallback)
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
