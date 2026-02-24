require('dotenv').config();

module.exports = {
    upstream: {
        url: 'http://tvstar.top:8080',
        username: '0210512422',
        password: '0210512422'
    },
    server: {
        port: process.env.PORT || 3000,
        baseUrl: process.env.BASE_URL || 'http://localhost:3000'
    }
};
